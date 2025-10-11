import type { NextConfig } from "next";
import withSerwistInit from "@serwist/next";

const nextConfig: NextConfig = {
  images: {
    qualities: [25, 50, 75, 90, 100],
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
      { protocol: 'https', hostname: 'example.com' },
      { protocol: 'https', hostname: 'gravatar.com' },
      { protocol: 'https', hostname: 'res.cloudinary.com' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'cdn.pixabay.com' },
    ],
  },
  turbopack: {
    root: __dirname,
  },
};

// THE FIX: Use withSerwistInit and remove all invalid top-level options.
const withSerwist = withSerwistInit({
  swSrc: "public/sw-base.js",
  swDest: "public/sw.js",
  disable: process.env.NODE_ENV === "development",
  // 'runtimeCaching' is NOT a valid property here and has been removed.
});

export default withSerwist(nextConfig);