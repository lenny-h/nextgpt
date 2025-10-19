import { sso } from "@better-auth/sso";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { createAuthMiddleware } from "better-auth/api";
import { admin, lastLoginMethod } from "better-auth/plugins";
import { HTTPException } from "hono/http-exception";
import { db } from "./drizzle/db.js";
import {
  sendPasswordResetEmail,
  sendVerificationEmail,
} from "./email/send-email.js";
import { getRedisClient } from "./utils/access-clients/redis-client.js";

export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL,
  database: drizzleAdapter(db, {
    provider: "pg",
  }),
  user: {
    additionalFields: {
      username: {
        type: "string",
        required: true,
      },
      isPublic: {
        type: "boolean",
        required: true,
        defaultValue: true,
      },
    },
  },
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    sendResetPassword: async ({ user, url, token }, request) => {
      await sendPasswordResetEmail({
        to: user.email,
        token,
      });
    },
  },
  emailVerification: {
    sendOnSignUp: true,
    autoSignInAfterVerification: true,
    sendVerificationEmail: async ({ user, url, token }, request) => {
      await sendVerificationEmail({
        to: user.email,
        token,
      });
    },
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      mapProfileToUser: (profile) => {
        return {
          username: profile.given_name,
          isPublic: true,
        };
      },
    },
    // github: {
    // 	clientId: process.env.GITHUB_CLIENT_ID || "",
    // 	clientSecret: process.env.GITHUB_CLIENT_SECRET || "",
    // 	mapProfileToUser: (profile) => {
    // 		return {
    // 			username: profile.name,
    // 			isPublic: true,
    // 		};
    // 	},
    // },
  },
  trustedOrigins: process.env.ALLOWED_ORIGINS?.split(","),
  session: {
    expiresIn: 60 * 60 * 24 * 30, // 30 days
    disableSessionRefresh: true,
    cookieCache: {
      enabled: true,
      maxAge: 10 * 60, // Cache duration in seconds
    },
  },
  plugins: [
    admin(),
    sso(),
    lastLoginMethod({
      storeInDatabase: true,
    }),
  ],
  secondaryStorage: {
    get: async (key) => {
      const redis = await getRedisClient();
      return await redis.get(key);
    },
    set: async (key, value, ttl) => {
      const redis = await getRedisClient();
      if (ttl) await redis.set(key, value, { EX: ttl });
      // or for ioredis:
      // if (ttl) await redis.set(key, value, 'EX', ttl)
      else await redis.set(key, value);
    },
    delete: async (key) => {
      const redis = await getRedisClient();
      await redis.del(key);
    },
  },
  hooks: {
    before: createAuthMiddleware(async (ctx) => {
      if (ctx.path !== "/sign-up/email") {
        return;
      }
      if (process.env.ALLOWED_EMAIL_DOMAINS) {
        const allowedDomains =
          process.env.ALLOWED_EMAIL_DOMAINS?.split(",") || [];
        const emailDomain = ctx.body?.email.split("@").pop();
        if (!emailDomain || !allowedDomains.includes(emailDomain)) {
          throw new HTTPException(400, {
            message: "INVALID_EMAIL_DOMAIN",
          });
        }
      }
    }),
  },
  rateLimit: {
    window: 300,
    max: 60,
    storage: "secondary-storage",
  },
  advanced: {
    database: {
      generateId: false,
    },
    // crossSubDomainCookies: {
    //   enabled: true,
    //   domain: "nextgpt.cloud", // your domain
    // },
  },
  logger: {
    disabled: false,
    disableColors: process.env.NODE_ENV !== "development",
    level: process.env.NODE_ENV === "development" ? "debug" : "error",
  },
});
