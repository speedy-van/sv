/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: [
    "@speedy-van/pricing",
    "@speedy-van/shared",
    "@speedy-van/utils",
  ],
  eslint: {
    // We use a local .eslintrc.json that skips Prettier formatting rules
    // during scaffolding. Re-enable strict lint in CI later.
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "res.cloudinary.com" },
    ],
  },
  experimental: {
    optimizePackageImports: ["@chakra-ui/react", "react-icons", "framer-motion"],
  },
};

export default nextConfig;
