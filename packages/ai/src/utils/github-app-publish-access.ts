export interface GitHubAppPublishAccess {
  contents?: string;
  issues?: string;
  pullRequests?: string;
  /** The installation's settings page on GitHub. */
  settingsUrl?: string;
}

export function githubAppInstallationCanPublishContent(
  access: GitHubAppPublishAccess | null
): boolean | null {
  if (!access) {
    return null;
  }

  return access.contents === "write" && access.pullRequests === "write";
}
