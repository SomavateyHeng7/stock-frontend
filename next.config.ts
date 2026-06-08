import type { NextConfig } from "next";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  allowedDevOrigins: ["desktop-btemagv.tail8ea37b.ts.net", "10.1.32.38", "localhost", "127.0.0.1"],
  turbopack: {
    root: projectRoot,
  },
};

export default nextConfig;
