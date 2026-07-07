/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [{ hostname: "images.pexels.com" }],
  },
  transpilePackages: ["@clerk/nextjs", "@clerk/clerk-react"],
};

export default nextConfig;
