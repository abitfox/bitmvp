/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // 允许通过环境变量指定构建输出目录。
  // 用途：当 .next 因故损坏时，可构建到全新目录而无需删除旧目录。
  distDir: process.env.NEXT_DIST_DIR || ".next",
};

export default nextConfig;
