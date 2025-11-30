import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "./schema.js";

export const db = drizzle(
  `postgresql://postgres:${process.env.DATABASE_PASSWORD}@${process.env.DATABASE_HOST}/postgres`,
  { schema }
);
