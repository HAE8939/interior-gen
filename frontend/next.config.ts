import type { NextConfig } from "next";
import path from "node:path";

// Allow Next.js to trace and import the sibling `vocabulary/` directory
// (i.e. `../vocabulary/*.json` from this app).
const projectRoot = path.join(__dirname, "..");

const nextConfig: NextConfig = {
  // Make sure JSON files in ../vocabulary are included in build tracing
  outputFileTracingRoot: projectRoot,
  // Allow turbopack to resolve outside the app directory
  turbopack: {
    root: projectRoot,
  },
};

export default nextConfig;
