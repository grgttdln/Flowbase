import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  transpilePackages: ['@flowbase/canvas', '@flowbase/ai', '@flowbase/shared'],
};

export default nextConfig;
