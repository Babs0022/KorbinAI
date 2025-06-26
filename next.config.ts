
import type {NextConfig} from 'next';
import withPWA from '@ducanh2912/next-pwa';

const isDev = process.env.NODE_ENV === 'development';
const enablePwaInDev = process.env.NEXT_PUBLIC_ENABLE_PWA_IN_DEV === 'true';

const pwaConfig = withPWA({
  dest: 'public',
  register: true,
  skipWaiting: true,
  // Disable PWA in development, unless explicitly enabled for testing
  disable: isDev && !enablePwaInDev,
});

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'avatar.iran.liara.run',
        port: '',
        pathname: '/**',
      },
    ],
  },
  webpack: (config, options) => {
    config.module.rules.push({
      test: /\.ico$/,
      loader: 'ignore-loader',
    });
    return config;
  },
};

export default pwaConfig(nextConfig);
