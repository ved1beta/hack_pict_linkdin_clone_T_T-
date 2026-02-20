/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  // Faster production builds - tree-shake heavy packages
  experimental: {
    optimizePackageImports: ["lucide-react", "framer-motion"],
    // Don't bundle pdf-parse/pdfjs-dist - avoids "Serverless PDF.js bundle could not be resolved"
    serverComponentsExternalPackages: ["pdf-parse", "pdfjs-dist"],
  },
  // Compress responses
  compress: true,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "links.papareact.com",
      },
      {
        protocol: "https",
        hostname: "img.clerk.com",
      },
      {
        protocol: "https",
        hostname: "linkedinclone.blob.core.windows.net",
      },
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
      {
        protocol: "https",
        hostname: "img.clerk.com",
      },
    ],
  },
};

export default nextConfig;
