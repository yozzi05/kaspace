import type { NextConfig } from 'next';

// Для GitHub Pages в некорневом репозитории: NEXT_PUBLIC_BASE_PATH=/имя-репозитория
const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? '';

const nextConfig: NextConfig = {
  output: 'export',
  basePath,
  trailingSlash: true,
  images: { unoptimized: true },
};

export default nextConfig;
