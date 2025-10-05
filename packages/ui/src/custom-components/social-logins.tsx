"use client";

import {
  GitHubIcon,
  GitLabIcon,
  GoogleIcon,
} from "@workspace/ui/components/icons";
import { Key } from "lucide-react";
import { memo, useState } from "react";
import { toast } from "sonner";
import { useSharedTranslations } from "../contexts/shared-translations-context";
import { client } from "../lib/auth-client";
import { SubmitButton } from "./submit-button";

export const SocialLogins = memo(() => {
  const { sharedT } = useSharedTranslations();

  const [isPending, setIsPending] = useState(false);

  const handleGoogleLogin = () => {
    const googleLoginPromise = async () => {
      setIsPending(true);

      const response = await client.signIn.social({
        provider: "google",
      });

      setIsPending(false);

      return response;
    };

    toast.promise(googleLoginPromise, {
      loading: "Redirecting to Google...",
      success: "Redirecting to Google",
      error: "Failed to redirect to Google",
    });
  };

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
          onClick={handleGoogleLogin}
          isPending={isPending}
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
