/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // تم استبدال قائمة domains بـ remotePatterns للسماح بأي مصدر خارجي
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**', // <-- السماح بأي نطاق
        pathname: '/**', // <-- السماح بأي مسار للملف
      },
    ],
  },
};

module.exports = nextConfig;