"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { memo } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
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
import { signIn } from "../lib/auth-client";
import { signInFormSchema, type SignInFormData } from "../lib/validations";
import { SocialLogins } from "./social-logins";
import { SSO } from "./sso";
import { SubmitButton } from "./submit-button";

export const SignIn = memo(() => {
  const { locale, sharedT } = useSharedTranslations();

  const router = useRouter();
  const searchParams = useSearchParams();

  const enableEmailSignup =
    process.env.NEXT_PUBLIC_ENABLE_EMAIL_SIGNUP === "true";
  const enableOAuthLogin =
    process.env.NEXT_PUBLIC_ENABLE_OAUTH_LOGIN === "true";
  const enableSSO = process.env.NEXT_PUBLIC_ENABLE_SSO === "true";

  // Count enabled auth methods to determine if dividers are needed
  const authMethodsCount = [
    enableEmailSignup,
    enableOAuthLogin,
    enableSSO,
  ].filter(Boolean).length;

  const form = useForm<SignInFormData>({
    resolver: zodResolver(signInFormSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  async function onSubmit(values: SignInFormData) {
    const signInPromise = signIn.email(
      {
        email: values.email,
        password: values.password,
        rememberMe: true,
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

    toast.promise(signInPromise, {
      loading: sharedT.signIn.signingIn,
      success: sharedT.signIn.success,
      error: (error) =>
        error.message || sharedT.signIn.error || "Failed to sign in",
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-6">
        <h1 className="w-full text-center text-2xl font-semibold">NextGPT</h1>

        {enableOAuthLogin && <SocialLogins />}

        {enableOAuthLogin && enableSSO && (
          <div className="after:border-border relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t">
            <span className="bg-background text-muted-foreground relative z-10 px-2">
              {sharedT.signIn.orSignInWithSSO}
            </span>
          </div>
        )}

        {enableSSO && <SSO />}

        {enableEmailSignup && authMethodsCount > 1 && (
          <div className="after:border-border relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t">
            <span className="bg-background text-muted-foreground relative z-10 px-2">
              {sharedT.signIn.orContinueWith}
            </span>
          </div>
        )}

        {enableEmailSignup && (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <div className="grid gap-6">
                <div className="grid gap-2">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{sharedT.signIn.emailLabel}</FormLabel>
                        <FormControl>
                          <Input placeholder="m@example.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="grid gap-2">
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <div className="flex items-center">
                          <FormLabel>{sharedT.signIn.passwordLabel}</FormLabel>
                          <Link
                            className="ml-auto text-sm underline-offset-4 hover:underline"
                            href={`/${locale}/forgot-password`}
                          >
                            {sharedT.signIn.forgotPassword}
                          </Link>
                        </div>
                        <FormControl>
                          <Input
                            type="password"
                            placeholder={sharedT.signIn.passwordPlaceholder}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <SubmitButton
                  className="w-full"
                  isPending={form.formState.isSubmitting}
                  pendingText={sharedT.signIn.signingIn}
                >
                  {sharedT.signIn.signInButton}
                </SubmitButton>
              </div>
            </form>
          </Form>
        )}

        {enableEmailSignup && (
          <div className="text-center text-sm">
            {sharedT.signIn.noAccountText}{" "}
            <Link
              className="underline underline-offset-4"
              href={`/${locale}/sign-up`}
            >
              {sharedT.signIn.signUpText}
            </Link>
          </div>
        )}
      </div>
      <div className="text-muted-foreground hover:[&_a]:text-primary text-balance text-center text-xs [&_a]:underline [&_a]:underline-offset-4">
        {sharedT.signIn.termsPrefix}{" "}
        <a href="#">{sharedT.signIn.termsOfService}</a>{" "}
        {sharedT.signIn.termsAnd} <a href="#">{sharedT.signIn.privacyPolicy}</a>
        .
      </div>
    </div>
  );
});
