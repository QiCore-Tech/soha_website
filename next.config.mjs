/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "export",
  images: {
    unoptimized: true
  },
  experimental: {
    optimizePackageImports: ["three", "@react-three/drei"]
  }
};

export default nextConfig;
