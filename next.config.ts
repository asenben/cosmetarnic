import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  images: {
    // Served as they are: the logo is a small PNG and photos are shrunk to JPEG in the browser
    // before upload, and Vercel's image optimisation answers 402 once the plan's quota runs out.
    unoptimized: true,
  },
};

export default nextConfig;
