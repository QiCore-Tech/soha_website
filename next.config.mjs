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

export default nextConfig;
