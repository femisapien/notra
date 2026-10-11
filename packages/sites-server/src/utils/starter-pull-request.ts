import { SITE_CONFIG_FILENAME } from "@notra/sites-core/constants/sites";

import { parseRootDirectory, repositoryPath } from "./root-directory";

export function starterRootMetadata(rootDirectory: string): string {
  return `<!-- notra:site-starter-root ${JSON.stringify(parseRootDirectory(rootDirectory))} -->`;
}

export function starterPullRequestMatchesRoot(
  body: string | null,
  rootDirectory: string
): boolean {
  if (!body) {
    return false;
  }
  const root = parseRootDirectory(rootDirectory);
  if (body.includes("notra:site-starter-root")) {
    const markers = body
      .split("\n")
      .filter((line) => line.includes("notra:site-starter-root"));
    return markers.length === 1 && markers[0] === starterRootMetadata(root);
  }
  const configLine = `- \`${repositoryPath(root, SITE_CONFIG_FILENAME)}\``;
  return body.split(/\r?\n/).some((line) => line === configLine);
}
