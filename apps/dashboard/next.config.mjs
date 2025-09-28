/** @type {import('next').NextConfig} */
const nextConfig = {
  async redirects() {
    return [
      {
        source: "/de",
        destination: "/de/buckets",
        permanent: true,
      },
      {
        source: "/en",
        destination: "/en/buckets",
        permanent: true,
      },
      {
        source: "/fr",
        destination: "/fr/buckets",
        permanent: true,
      },
    ];
  },
  output: "standalone",
  transpilePackages: ["@workspace/ui"],
};

export default nextConfig;
