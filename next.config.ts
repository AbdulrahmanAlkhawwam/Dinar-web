import path from "node:path";

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    // Without this, a stray package-lock.json higher up the tree (one exists
    // in the user's home folder) is taken as the workspace root.
    root: path.join(__dirname),
  },
};

export default nextConfig;
