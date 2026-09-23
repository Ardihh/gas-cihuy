import { CATALOG_IMAGE_REMOTE_PATTERNS } from "./lib/catalog-image.mjs";

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: CATALOG_IMAGE_REMOTE_PATTERNS,
  },
};

export default nextConfig;
