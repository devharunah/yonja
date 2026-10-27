import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Everything runs in the browser against Firestore and Firebase AI Logic, so the app
  // exports to static files that Firebase Hosting serves on the free plan.
  output: "export",
  images: { unoptimized: true },
  // Generates route types into .next/types, so a typo in a `Link href` or a
  // `router.push` is a compile error rather than a 404 someone finds later.
  typedRoutes: true,
  experimental: {
    // Types the environment variables the dev server loaded, which gives
    // `requireEnv` callers real completions instead of a bare string.
    typedEnv: true,
  },
};

export default nextConfig;
