const ROOT_DIRECTORY = /^(?:[A-Za-z0-9._-]+\/)*[A-Za-z0-9._-]*$/;

export function isSafeRootDirectory(rootDirectory: string): boolean {
  return (
    ROOT_DIRECTORY.test(rootDirectory) &&
    !rootDirectory
      .split("/")
      .some((segment) => segment === ".." || segment.startsWith("."))
  );
}
