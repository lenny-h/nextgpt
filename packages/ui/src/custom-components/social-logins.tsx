"use client";

import {
  GitHubIcon,
  GitLabIcon,
  GoogleIcon,
} from "@workspace/ui/components/icons";
import { Key } from "lucide-react";
import { memo } from "react";
import { useSharedTranslations } from "../contexts/shared-translations-context.js";
import { client } from "../lib/auth-client";
import { SubmitButton } from "./submit-button.js";

export const SocialLogins = memo(() => {
  const { sharedT } = useSharedTranslations();

  return (
    <div className="flex flex-col gap-4">
      <SubmitButton
        variant="outline"
        className="border-primary w-full"
        isPending={false}
        pendingText="Signing in..."
        disabled
      >
        <Key />
        {sharedT.socialLogins.loginWithInstitution}
      </SubmitButton>
      <div className="grid grid-cols-3 gap-4">
        <SubmitButton
          variant="outline"
          className="border-primary w-full"
          onClick={() =>
            client.signIn.social({
              provider: "google",
            })
          }
          isPending={false}
          pendingText="Redirecting..."
        >
          <GoogleIcon />
          Google
        </SubmitButton>
        <SubmitButton
          variant="outline"
          className="border-primary w-full"
          isPending={false}
          pendingText="Redirecting..."
          disabled
        >
          <GitHubIcon />
          GitHub
        </SubmitButton>
        <SubmitButton
          variant="outline"
          className="border-primary w-full"
          isPending={false}
          pendingText="Redirecting..."
          disabled
        >
          <GitLabIcon />
          GitLab
        </SubmitButton>
      </div>
    </div>
  );
});
