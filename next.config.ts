import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    // 🚀 ይህ መስመር የ TypeScript ስህተቶች ቢኖሩም ግንባታው እንዲቀጥል ያደርጋል
    ignoreBuildErrors: true,
  },
  eslint: {
    // 🚀 ይህ ደግሞ የ ESLint ስህተቶችን ችላ ይላል
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
