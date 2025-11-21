/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  transpilePackages: ["@workspace/ui", "@workspace/server"],
  serverExternalPackages: ["@vercel/og"],
  experimental: {
    optimizePackageImports: [
      "react-syntax-highlighter",
      "@codemirror/state",
      "@codemirror/view",
      "prosemirror-model",
      "prosemirror-state",
      "prosemirror-view",
      "framer-motion",
    ],
  },
};

export default nextConfig;
