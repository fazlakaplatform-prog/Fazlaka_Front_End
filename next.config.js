/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: [
      "img.clerk.com", // السماح بعرض صور من Clerk
      "growing-acoustics-35909e61eb.media.strapiapp.com", // Strapi media domain
      "localhost", // For local development
      "cdn.sanity.io", // Sanity CDN for images
      "res.cloudinary.com", // Cloudinary domain for images
    ],
  },
};

module.exports = nextConfig;