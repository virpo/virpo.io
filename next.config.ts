import type { NextConfig } from "next";
import { resolve } from "node:path";

const config: NextConfig = {
  output: "export",
  trailingSlash: true,
  distDir: "dist",
  images: { unoptimized: true },
  turbopack: { root: resolve(process.cwd()) },
};

export default config;
