import type { NextConfig } from "next";

// The browser keeps calling /api/... on this Next.js app; Next forwards those requests to the
// Express backend (backend/). Same origin for the browser, so the httpOnly session cookie just works.
const BACKEND_URL = process.env.BACKEND_URL ?? "http://localhost:4000";

const nextConfig: NextConfig = {
  async rewrites() {
    return [{ source: "/api/:path*", destination: `${BACKEND_URL}/api/:path*` }];
  },
};

export default nextConfig;
