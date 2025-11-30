import "dotenv/config";
import { defineConfig } from "drizzle-kit";

const dbPassword = process.env.DATABASE_PASSWORD;
const dbHost = process.env.DATABASE_HOST;

const dbSsl = process.env.DB_SSL === "true";

if (!dbPassword || !dbHost) {
  throw new Error("DATABASE_PASSWORD and DATABASE_HOST must be set");
}

export default defineConfig({
  out: "./src/drizzle",
  schema: "./src/drizzle/schema.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: `postgresql://postgres:${dbPassword}@${dbHost}/postgres${dbSsl ? "?sslmode=require" : ""}`,
  },
});
