import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  webpack: (config) => {
    config.externals = [...(config.externals || []), { bufferutil: "bufferutil", "utf-8-validate": "utf-8-validate" }];
    return config;
  },
  // Required for Socket.IO
  typescript: {
    ignoreBuildErrors: true,
  },
  async headers() {
    const allowedOrigin = process.env.NEXT_PUBLIC_FRONTEND_ORIGIN || "*";
    return [
      {
        source: "/api/socket",
        headers: [
          { key: "Access-Control-Allow-Credentials", value: "true" },
          { key: "Access-Control-Allow-Origin", value: "https://copperscanner.onrender.com" },
          { key: "Access-Control-Allow-Methods", value: "GET,OPTIONS,PATCH,DELETE,POST,PUT" },
          { key: "Access-Control-Allow-Headers", value: "X-Requested-With, Content-Type, Authorization" },
        ],
      },
    ];
  },
};

export default nextConfig;


