import "dotenv/config";
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  out: "./src/drizzle",
  schema: "./src/drizzle/schema.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: `postgresql://postgres:${process.env.DATABASE_PASSWORD}@${process.env.DATABASE_HOST}/postgres?sslmode=require`,
  },
});
