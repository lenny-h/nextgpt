"use client";

import {
  GitHubIcon,
  GitLabIcon,
  GoogleIcon,
} from "@workspace/ui/components/icons";
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
      loading: sharedT.socialLogins.redirectingTo.replace(
        "{provider}",
        "Google"
      ),
      success: sharedT.socialLogins.redirectingTo.replace(
        "{provider}",
        "Google"
      ),
      error: sharedT.socialLogins.redirectError.replace("{provider}", "Google"),
    });
  };

  return (
    <div className="grid grid-cols-3 gap-4">
      <SubmitButton
        variant="outline"
        className="border-primary w-full"
        onClick={handleGoogleLogin}
        isPending={isPending}
        pendingText={sharedT.signIn.redirecting}
      >
        <GoogleIcon />
        Google
      </SubmitButton>
      <SubmitButton
        variant="outline"
        className="border-primary w-full"
        isPending={false}
        pendingText={sharedT.signIn.redirecting}
        disabled
      >
        <GitHubIcon />
        GitHub
      </SubmitButton>
      <SubmitButton
        variant="outline"
        className="border-primary w-full"
        isPending={false}
        pendingText={sharedT.signIn.redirecting}
        disabled
      >
        <GitLabIcon />
        GitLab
      </SubmitButton>
    </div>
  );
});
