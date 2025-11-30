import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "./schema.js";

const dbSsl = process.env.DB_SSL === "true";

export const db = drizzle(
  `postgresql://postgres:${process.env.DATABASE_PASSWORD}@${process.env.DATABASE_HOST}/postgres${dbSsl ? "?sslmode=require" : ""}`,
  { schema }
);
