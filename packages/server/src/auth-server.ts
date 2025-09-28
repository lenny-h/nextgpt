import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "./drizzle/db.js";

// const redis = createClient();
// await redis.connect();

export const auth = betterAuth({
  basePath: process.env.BETTER_AUTH_URL + "/capi/auth",
  database: drizzleAdapter(db, {
    provider: "pg", // or "mysql", "sqlite"
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
        default: true,
      },
    },
  },
  emailAndPassword: {
    enabled: true,
    // requireEmailVerification: true,
    // sendResetPassword: async ({ user, url, token }, request) => {
    //   await sendEmail({
    //     to: user.email,
    //     subject: "Reset your password",
    //     text: `Click the link to reset your password: ${url}`,
    //   });
    // },
  },
  // emailVerification: {
  //   sendOnSignUp: true,
  //   autoSignInAfterVerification: true,
  //   sendVerificationEmail: async ({ user, url, token }, request) => {
  //     await sendEmail({
  //       to: user.email,
  //       subject: "Verify your email address",
  //       text: `Click the link to verify your email: ${url}`,
  //     });
  //   },
  // },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    },
    // github: {
    // 	clientId: process.env.GITHUB_CLIENT_ID || "",
    // 	clientSecret: process.env.GITHUB_CLIENT_SECRET || "",
    // },
  },
  trustedOrigins: process.env.ALLOWED_ORIGINS?.split(","),
  session: {
    cookieCache: {
      enabled: true,
      maxAge: 10 * 60, // Cache duration in seconds
    },
  },
  // secondaryStorage: {
  // 	get: async (key) => {
  // 		return await redis.get(key);
  // 	},
  // 	set: async (key, value, ttl) => {
  // 		if (ttl) await redis.set(key, value, { EX: ttl });
  // 		// or for ioredis:
  // 		// if (ttl) await redis.set(key, value, 'EX', ttl)
  // 		else await redis.set(key, value);
  // 	},
  // 	delete: async (key) => {
  // 		await redis.del(key);
  // 	}
  // }
  advanced: {
    crossSubDomainCookies: {
      enabled: true,
      domain: "nextgpt.cloud", // your domain
    },
  },
});
