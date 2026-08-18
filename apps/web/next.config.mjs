/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // ให้ Next คอมไพล์ workspace package ที่แชร์กับ socket server
  transpilePackages: ['@apc/shared'],
};

export default nextConfig;
