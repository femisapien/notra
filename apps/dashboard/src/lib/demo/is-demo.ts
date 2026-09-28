export function isDemoPath(pathname: string): boolean {
  return pathname === "/demo" || pathname.startsWith("/demo/");
}

export function isDemoBrowser(): boolean {
  return typeof window !== "undefined" && isDemoPath(window.location.pathname);
}
