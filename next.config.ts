import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // pdfjs-dist and mammoth use Node.js native APIs and should not be bundled
  // by Turbopack — they must be loaded directly from node_modules.
  serverExternalPackages: ['pdfjs-dist', 'mammoth', 'canvas'],
};

export default nextConfig;
