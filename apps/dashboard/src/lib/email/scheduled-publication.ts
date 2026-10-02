import { db } from "@notra/db/drizzle";
import {
  connectedSocialAccounts,
  githubIntegrations,
  organizationNotificationSettings,
  organizations,
  posts,
  scheduledPublications,
  users,
} from "@notra/db/schema";
import { EMAIL_CONFIG } from "@notra/email/utils/config";
import { getResend } from "@notra/email/utils/resend";
import { socialConnectPlatformSchema } from "@notra/schemas/dashboard/social-accounts";
import { and, eq } from "drizzle-orm";

import { SOCIAL_PLATFORM_LABELS } from "@/constants/social-connect";
import { sendScheduledPublicationFailedEmail } from "@/lib/email/send";

async function describeDestination(
  organizationId: string,
  config: typeof scheduledPublications.$inferSelect.destinationConfig
) {
  if (config.destination === "github") {
    const repository = await db.query.githubIntegrations.findFirst({
      columns: { owner: true, repo: true },
      where: and(
        eq(githubIntegrations.id, config.repositoryId),
        eq(githubIntegrations.organizationId, organizationId)
      ),
    });
    return repository?.owner && repository.repo
      ? `GitHub (${repository.owner}/${repository.repo})`
      : "GitHub";
  }
  if (config.destination === "social") {
    const account = await db.query.connectedSocialAccounts.findFirst({
      columns: { provider: true, username: true },
      where: and(
        eq(connectedSocialAccounts.id, config.accountId),
        eq(connectedSocialAccounts.organizationId, organizationId)
      ),
    });
    if (!account) {
      return "social media";
    }
    const provider = socialConnectPlatformSchema.safeParse(account.provider);
    const platform = provider.success
      ? SOCIAL_PLATFORM_LABELS[provider.data]
      : account.provider;
    return `${platform} (@${account.username})`;
  }
  return "Notra";
}

function formatScheduledFor(scheduledAt: Date, timeZone: string) {
  try {
    return new Intl.DateTimeFormat("en-US", {
      dateStyle: "full",
      timeStyle: "short",
      timeZone,
    }).format(scheduledAt);
  } catch {
    return scheduledAt.toUTCString();
  }
}

/**
 * Emails whoever scheduled the post that one destination gave up. Honors the
 * organization's "scheduled content failed" setting, which defaults to on.
 * The Resend idempotency key makes a retried step send at most once.
 */
export async function notifyScheduledPublicationFailed(
  scheduledPublicationId: string
): Promise<void> {
  const [row] = await db
    .select({
      id: scheduledPublications.id,
      organizationId: scheduledPublications.organizationId,
      postId: scheduledPublications.postId,
      destinationConfig: scheduledPublications.destinationConfig,
      scheduledAt: scheduledPublications.scheduledAt,
      timeZone: scheduledPublications.timeZone,
      lastError: scheduledPublications.lastError,
      status: scheduledPublications.status,
      failedAt: scheduledPublications.updatedAt,
      postTitle: posts.title,
      organizationName: organizations.name,
      organizationSlug: organizations.slug,
      recipientEmail: users.email,
      failedNotificationsEnabled:
        organizationNotificationSettings.scheduledContentFailed,
    })
    .from(scheduledPublications)
    .innerJoin(posts, eq(posts.id, scheduledPublications.postId))
    .innerJoin(
      organizations,
      eq(organizations.id, scheduledPublications.organizationId)
    )
    .leftJoin(users, eq(users.id, scheduledPublications.createdByUserId))
    .leftJoin(
      organizationNotificationSettings,
      eq(
        organizationNotificationSettings.organizationId,
        scheduledPublications.organizationId
      )
    )
    .where(eq(scheduledPublications.id, scheduledPublicationId))
    .limit(1);

  if (
    !row?.recipientEmail ||
    row.status !== "failed" ||
    row.failedNotificationsEnabled === false
  ) {
    return;
  }

  const resend = getResend();
  if (!resend) {
    console.warn(
      "[ScheduledPublication] Resend is not configured, skipping failure email",
      { scheduledPublicationId }
    );
    return;
  }

  const result = await sendScheduledPublicationFailedEmail(resend, {
    recipientEmail: row.recipientEmail,
    // A row that fails again after a manual retry is a new failure.
    failureKey: `${row.id}:${row.failedAt.getTime()}`,
    organizationName: row.organizationName,
    organizationSlug: row.organizationSlug,
    postTitle: row.postTitle,
    destinationLabel: await describeDestination(
      row.organizationId,
      row.destinationConfig
    ),
    scheduledFor: formatScheduledFor(row.scheduledAt, row.timeZone),
    reason: row.lastError ?? "Unknown error",
    postLink: `${EMAIL_CONFIG.getAppUrl()}/${row.organizationSlug}/content/${row.postId}`,
  });
  if (result.error) {
    throw new Error(
      `Failed to send scheduled publication failure email: ${result.error.message}`
    );
  }
}
