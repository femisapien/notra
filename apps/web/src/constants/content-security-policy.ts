import { APP_URL } from "../utils/urls";

const DASHBOARD_SESSION_ORIGIN =
  process.env.NODE_ENV === "development" ? "http://localhost:3000" : APP_URL;

export const WEB_CONTENT_SECURITY_POLICY = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' databuddy.cc *.databuddy.cc https://challenges.cloudflare.com",
  "style-src 'self' 'unsafe-inline'",
  "font-src 'self'",
  "img-src 'self' data: blob: databuddy.cc *.databuddy.cc avatars.githubusercontent.com cdn.contentport.io media.brand.dev *.r2.dev cdn.usenotra.com pbs.twimg.com abs.twimg.com",
  `connect-src 'self' databuddy.cc *.databuddy.cc *.inth.app *.c15t.com *.c15t.dev ${DASHBOARD_SESSION_ORIGIN}`,
  "frame-src https://challenges.cloudflare.com",
  "frame-ancestors 'none'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "upgrade-insecure-requests",
];
