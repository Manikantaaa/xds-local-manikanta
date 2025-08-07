/* eslint-disable @typescript-eslint/no-var-requires */
/** @type {import('next').NextConfig} */

const nextConfig = {
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: true,
  },
  webpack(config) {
    config.module.rules.push({
      test: /\.map$/,
      use: 'ignore-loader',
    });

    return config;
  },
  // images: {
  //   remotePatterns: ['i.vimeocdn.com','storage.googleapis.com','www.youtube.com','img.youtube.com','www.vimeo.com','youtu.be'], // Update the configuration to use 'domains' instead of 'remotePatterns'
  // },
  images: {
    remotePatterns: [
      
      {
        protocol: "https",
        hostname: "storage.googleapis.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "www.youtube.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "www.vimeo.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "img.youtube.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "youtu.be",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "i.vimeocdn.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "http",
        hostname: "localhost",
        port: "3000",
        pathname: "/**",
      },
    ],
  },

  async headers() {
    return [
      {
        source: '/((?!embed).*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
        ],
      },
    ];
  },
};
module.exports = nextConfig;
