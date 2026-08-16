import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  cacheComponents: true,
  serverExternalPackages: ["socket.io", "pdf-parse", "pdfjs-dist"],
};

export default nextConfig;
