/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  // Faster production builds - tree-shake heavy packages
  experimental: {
    optimizePackageImports: ["lucide-react", "framer-motion"],
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
