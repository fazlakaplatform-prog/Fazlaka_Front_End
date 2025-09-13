/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: [
      "img.clerk.com", // السماح بعرض صور من Clerk
      "growing-acoustics-35909e61eb.media.strapiapp.com", // Strapi media domain
      "localhost", // For local development
    ],
  },
};

module.exports = nextConfig;