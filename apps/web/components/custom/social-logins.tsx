"use client";

import { SubmitButton } from "@/components/custom/submit-button";
import { useGlobalTranslations } from "@/contexts/global-translations";
import { createClient } from "@/lib/supabase/client";
import {
  GitHubIcon,
  GitLabIcon,
  GoogleIcon,
} from "@workspace/ui/components/icons";
import { Key } from "lucide-react";

export const SocialLogins = () => {
  const { globalT } = useGlobalTranslations();
  const supabase = createClient();

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
        {globalT.components.socialLogins.loginWithInstitution}
      </SubmitButton>
      <div className="grid grid-cols-3 gap-4">
        <SubmitButton
          variant="outline"
          className="border-primary w-full"
          onClick={() =>
            supabase.auth.signInWithOAuth({
              provider: "google",
              options: {
                redirectTo: `${process.env.NEXT_PUBLIC_BASE_URL}/auth/callback`,
              },
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
};
