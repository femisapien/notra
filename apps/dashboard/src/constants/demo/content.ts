import type {
  ContentResponse,
  Post,
  PostCollectionSummary,
} from "@notra/schemas/dashboard/content";

import { buildContentPublishingMetrics } from "@/utils/content-publishing-metrics";

export const DEMO_POSTS: Post[] = (
  [
    {
      title: "A database for every preview deployment",
      contentType: "blog_post",
      status: "published",
      markdown:
        "# A database for every preview deployment\n\nYour code gets a preview environment. Your database should too.\n\nNeon database branching creates an isolated copy of your Postgres database. Connect each preview deployment to its own branch, test the change, and remove the branch when the pull request closes.\n\n## Test the whole change\n\nRun your schema migration on the branch before testing the application. Check the queries affected by the new schema and review your rollout plan.\n\n## Keep environments separate\n\nUse a separate connection string and appropriate access controls for each environment. Branching gives you isolation; it does not replace careful handling of production data.\n\nIllustrative content for the Notra demo.",
    },
    {
      title: "Test your next Postgres migration on a branch",
      contentType: "blog_post",
      status: "draft",
      markdown:
        "# Test your next Postgres migration on a branch\n\nCreate a branch before applying your migration. Run application checks against the changed schema and verify your rollback plan.\n\n## A repeatable workflow\n\n1. Create an isolated database branch.\n2. Apply the migration.\n3. Run application checks.\n4. Review the results and clean up the branch.\n\nIllustrative content for the Notra demo.",
    },
    {
      title: "Your development database can take a break",
      contentType: "linkedin_post",
      status: "draft",
      markdown:
        "Development databases often spend more time waiting than running queries.\n\nNeon's scale to zero can suspend idle compute between sessions. When a new connection arrives, compute resumes. Account for the wake-up when choosing where to use it.\n\nIllustrative content for the Notra demo.",
    },
    {
      title: "Connection pooling for serverless functions",
      contentType: "blog_post",
      status: "published",
      markdown:
        "# Connection pooling for serverless functions\n\nA serverless application can create many short-lived connections. Use a pooled connection string for request traffic and a direct connection where your migration tool requires it.\n\n## Start with the connection budget\n\nCount the maximum concurrent functions, their pool sizes, and the connections reserved for background jobs. Load-test the application before increasing concurrency.",
    },
    {
      title: "Preview environments should include your database",
      contentType: "linkedin_post",
      status: "published",
      markdown:
        "A preview deployment is only useful if the data layer is isolated too.\n\nGive each pull request a database branch. Apply its migrations, run the integration tests, and clean up when the branch is merged.\n\nThe benefit is practical: two developers can change the schema without breaking each other\u2019s work.",
    },
    {
      title: "A practical checklist for production Postgres",
      contentType: "blog_post",
      status: "draft",
      markdown:
        "# A practical checklist for production Postgres\n\nBefore launch, verify your connection limits, recovery procedure, slow queries and access controls.\n\n## Test recovery before you need it\n\nDocument the recovery objective. Restore into an isolated environment and verify the application can read the recovered data. Record how long the complete process takes.",
    },
    {
      title: "What scale to zero means for your application",
      contentType: "blog_post",
      status: "published",
      markdown:
        "# What scale to zero means for your application\n\nIdle compute can suspend between requests. This is useful for intermittent workloads, but the first connection after suspension may take longer.\n\n## Match the setting to the workload\n\nMeasure the first-request latency separately from warm requests. Consider keeping latency-sensitive production workloads active while allowing development branches to suspend.",
    },
    {
      title: "Give your coding agent a disposable database",
      contentType: "linkedin_post",
      status: "draft",
      markdown:
        "An agent should be able to test a migration without touching production.\n\nCreate a dedicated database branch, provide narrowly scoped credentials, and inspect the schema diff before merging.\n\nFast experimentation works best when the environment is easy to replace.",
    },
    {
      title: "Safer schema changes with expand and contract",
      contentType: "blog_post",
      status: "published",
      markdown:
        "# Safer schema changes with expand and contract\n\nDeploy schema changes in stages. Add the new column, update the application to support both shapes, backfill existing rows, and remove the old column after all consumers have moved.\n\nTest each stage against an isolated branch. A successful migration command is only one part of a safe rollout.",
    },
    {
      title: "Postgres branching: three workflows to try",
      contentType: "linkedin_post",
      status: "published",
      markdown:
        "Three places where database branching is useful:\n\n1. A preview database for every pull request.\n2. An isolated environment for migration rehearsal.\n3. A disposable database for agent experiments.\n\nChoose one workflow first, automate cleanup, and measure the time saved.",
    },
    {
      title: "Migrating a small application to managed Postgres",
      contentType: "blog_post",
      status: "draft",
      markdown:
        "# Migrating a small application to managed Postgres\n\nInventory extensions, connection settings and background workers before moving the database. Rehearse the export and restore process, compare row counts, and test the cutover plan.\n\nKeep a clear rollback point. The migration is complete when the application and its scheduled jobs work against the new database.",
    },
    {
      title: "Your database checklist for the next sprint",
      contentType: "linkedin_post",
      status: "published",
      markdown:
        "This week\u2019s developer checklist:\n\nCheck your slowest query. Remove an unused preview branch. Rehearse one schema migration. Verify that your recovery instructions still work.\n\nSmall maintenance tasks are easier to fit into a sprint than a production incident.",
    },
  ] satisfies Pick<Post, "title" | "contentType" | "status" | "markdown">[]
).map((post, index) => ({
  ...post,
  id: `demo-post-${index}`,
  slug: null,
  content: post.markdown,
  htmlUrl: null,
  contentSubtype: null,
  createdAt: `2026-09-${24 - index}T09:00:00Z`,
  updatedAt: `2026-09-${24 - index}T09:00:00Z`,
}));
export const DEMO_COLLECTIONS: PostCollectionSummary[] = DEMO_POSTS.map(
  (post, index) => ({
    id: `demo-collection-${index}`,
    name: post.title,
    source: "manual",
    nameSource: "user",
    contentTypes: [post.contentType],
    postCount: 1,
    singlePost: { id: post.id, title: post.title },
    expectedPostCount: 1,
    isGenerating: false,
    statusSummary: {
      total: 1,
      draft: post.status === "draft" ? 1 : 0,
      published: post.status === "published" ? 1 : 0,
    },
    createdAt: post.createdAt,
  })
);
export const DEMO_CONTENT: ContentResponse[] = DEMO_POSTS.map((post) => ({
  ...post,
  date: post.createdAt,
  rawHtml: null,
  recommendations: null,
  githubPublish: null,
  sourceMetadata: null,
}));
export const DEMO_PAGINATION = {
  page: 1,
  pageSize: 12,
  totalCount: DEMO_POSTS.length,
  totalPages: 1,
};

export const DEMO_CONTENT_METRICS = buildContentPublishingMetrics(
  DEMO_POSTS.map((post) => ({
    day: post.createdAt.slice(0, 10),
    drafts: post.status === "draft" ? 1 : 0,
    strictDrafts: post.status === "draft" ? 1 : 0,
    published: post.status === "published" ? 1 : 0,
  })),
  new Date("2026-01-01T00:00:00Z"),
  new Date("2027-01-01T00:00:00Z")
);
