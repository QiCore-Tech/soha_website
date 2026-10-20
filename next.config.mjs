import { PHASE_DEVELOPMENT_SERVER } from "next/constants.js";

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "export",
  distDir: process.env.QICORE_PREVIEW === "1" ? ".next-preview" : ".next",
  images: {
    unoptimized: true
  },
  experimental: {
    optimizePackageImports: ["three", "@react-three/drei"]
  }
};

// Concurrent dev servers must not share generated files with each other or builds.
// Only development may opt into an isolated cache; static export stays unchanged.
export default function config(phase) {
  return {
    ...nextConfig,
    ...(phase === PHASE_DEVELOPMENT_SERVER && process.env.QICORE_DEV_DIST_DIR
      ? { distDir: process.env.QICORE_DEV_DIST_DIR }
      : {})
  };
}
