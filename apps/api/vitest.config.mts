import { config } from "dotenv";
import path from "path";
import { defineConfig } from "vitest/config";

config({ path: ".env" });

export default defineConfig({
  resolve: {
    alias: {
      "@workspace/api-routes": path.resolve(
        __dirname,
        "../../packages/api-routes/src"
      ),
      "@workspace/server": path.resolve(__dirname, "../../packages/server/src"),
      "@workspace/ui": path.resolve(__dirname, "../../packages/ui/src"),
    },
  },
  test: {
    environment: "node",
    testTimeout: 30000,
  },
});
