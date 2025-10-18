import { ssoClient } from "@better-auth/sso/client";
import {
  adminClient,
  inferAdditionalFields,
  lastLoginMethodClient,
  usernameClient,
} from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";
import { toast } from "sonner";

export const client = createAuthClient({
  baseURL: `${process.env.NEXT_PUBLIC_API_URL}/capi/auth`,
  plugins: [
    usernameClient(),
    adminClient(),
    ssoClient(),
    lastLoginMethodClient(),
    // oneTapClient({
    //   clientId: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!,
    //   promptOptions: {
    //     maxAttempts: 1,
    //   },
    // }),
    inferAdditionalFields({
      user: {
        username: {
          type: "string",
          required: true,
        },
        isPublic: {
          type: "boolean",
          required: true,
        },
      },
    }),
  ],
  fetchOptions: {
    onError(e) {
      if (e.error.status === 429) {
        toast.error("Too many requests. Please try again later.");
      }
    },
  },
});

export const { signUp, signIn, signOut, useSession } = client;
