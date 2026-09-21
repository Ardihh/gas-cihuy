import { CATALOG_IMAGE_REMOTE_PATTERN } from "./lib/catalog-image.mjs";

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [CATALOG_IMAGE_REMOTE_PATTERN],
  },
};

export default nextConfig;
