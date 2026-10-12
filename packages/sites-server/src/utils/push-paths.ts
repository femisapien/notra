import { PUSH_PAYLOAD_COMMIT_LIMIT } from "../constants/webhooks";
import type { PushPayload } from "../types/webhooks";

/**
 * Whether a push could change a site rooted at `rootDirectory`. Answers true
 * whenever the payload can't prove otherwise (force pushes, new branches,
 * truncated commit lists), so only pushes that clearly stay outside the
 * folder are skipped.
 */
export function pushTouchesRootDirectory(
  payload: PushPayload,
  rootDirectory: string
): boolean {
  const commits = payload.commits ?? [];
  if (
    !rootDirectory ||
    payload.forced ||
    payload.created ||
    commits.length === 0 ||
    commits.length >= PUSH_PAYLOAD_COMMIT_LIMIT
  ) {
    return true;
  }
  const prefix = `${rootDirectory}/`;
  return commits.some((commit) =>
    [
      ...(commit.added ?? []),
      ...(commit.modified ?? []),
      ...(commit.removed ?? []),
    ].some((path) => path.startsWith(prefix))
  );
}
