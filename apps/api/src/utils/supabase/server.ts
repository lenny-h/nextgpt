import { createServerClient } from "@supabase/ssr";
import { type Context } from "hono";
import { type Database } from "../../types/database.js";

export const createClient = async (c: Context) => {
  return createServerClient<Database>(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          const cookies = c.req.header("cookie");
          if (!cookies) return [];

          return cookies.split(";").map((cookie) => {
            const [name, value] = cookie.trim().split("=");
            return { name, value };
          });
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              c.header(
                "Set-Cookie",
                `${name}=${value}; ${Object.entries(options || {})
                  .map(([k, v]) => `${k}=${v}`)
                  .join("; ")}`
              );
            });
          } catch (error) {
            // Handle cookie setting errors
          }
        },
      },
    }
  );
};
