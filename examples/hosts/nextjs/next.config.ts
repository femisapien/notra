import type { NextConfig } from "next";

// The site's Notra address, from the Domains page. Set NOTRA_SITE_ORIGIN to try
// another one, like a local build served on http://localhost:4321.
const NOTRA_SITE = process.env.NOTRA_SITE_ORIGIN ?? "https://pathway-nextjs.notra.site";

const nextConfig: NextConfig = {
  async rewrites() {
    return {
      beforeFiles: [
        { source: "/blog", destination: `${NOTRA_SITE}/blog` },
        { source: "/blog/:path*", destination: `${NOTRA_SITE}/blog/:path*` },
        { source: "/changelog", destination: `${NOTRA_SITE}/changelog` },
        { source: "/changelog/:path*", destination: `${NOTRA_SITE}/changelog/:path*` },
      ],
    };
  },
};

export default nextConfig;
