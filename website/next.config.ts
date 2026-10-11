import type { NextConfig } from "next";

const config: NextConfig = {
  reactStrictMode: true,
  async redirects() {
    return [
      {
        source: "/blog/polish-is-overrated-consistency-compounds",
        destination: "/blog/posting-consistently-is-the-only-thing-that-matters",
        permanent: true,
      },
    ];
  },
};

export default config;
