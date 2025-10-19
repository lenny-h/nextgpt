import "dotenv/config";
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  out: "./src/drizzle",
  schema: "./src/drizzle/schema.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: "postgresql://postgres:Indacloudby50$@localhost:5432/postgres",
    // process.env.DATABASE_URL!,
  },
});
