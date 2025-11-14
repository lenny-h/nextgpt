"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Key } from "lucide-react";
import { useRouter } from "next/navigation";
import { memo } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../components/form";
import { Input } from "../components/input";
import { useSharedTranslations } from "../contexts/shared-translations-context";
import { client } from "../lib/auth-client";
import { SubmitButton } from "./submit-button";

const ssoFormSchema = z.object({
  email: z.email("Please enter a valid email address"),
});

type SSOFormData = z.infer<typeof ssoFormSchema>;

export const SSO = memo(() => {
  const { sharedT, locale } = useSharedTranslations();

  const router = useRouter();

  const form = useForm<SSOFormData>({
    resolver: zodResolver(ssoFormSchema),
    defaultValues: {
      email: "",
    },
  });

  async function onSubmit(values: SSOFormData) {
    console.log("SSO form submitted with values:", values);

    const ssoLoginPromise = client.signIn.sso(
      {
        email: values.email,
        callbackURL: `${window.location.origin}/${locale}/`,
      },
      {
        onSuccess() {
          router.push(`/${locale}/`);
        },
        onError(context) {
          throw new Error(context.error.message);
        },
      }
    );

    toast.promise(ssoLoginPromise, {
      loading: "Redirecting to institution SSO...",
      success: "Redirecting to institution SSO",
      error: "Failed to redirect to institution SSO",
    });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <div className="grid gap-4">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Institution Email</FormLabel>
                <FormControl>
                  <Input placeholder="user@institution.edu" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <SubmitButton
            className="w-full"
            isPending={form.formState.isSubmitting}
            pendingText="Redirecting..."
          >
            <Key className="mr-2" />
            {sharedT.socialLogins.loginWithInstitution}
          </SubmitButton>
        </div>
      </form>
    </Form>
  );
});
