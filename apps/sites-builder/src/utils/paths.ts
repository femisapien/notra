/**
 * `/blog` + `post` → `/blog/post`, `/` + `post` → `/post`, `/blog` + `` → `/blog`.
 * Same as joinMountPath in @notra/sites-core, which the theme can't import at runtime.
 */
export function mountPath(mount: string, path = ""): string {
  const tail = path.replace(/^\/+/, "");
  if (mount === "/") {
    return `/${tail}`;
  }
  return tail ? `${mount}/${tail}` : mount;
}
