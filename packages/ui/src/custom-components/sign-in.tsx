"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { memo, useEffect } from "react";
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
  const { locale } = useSharedTranslations();

  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const token = searchParams.get("token");

    if (token) {
      const verifyEmail = async () => {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/auth/verify-email?token=${token}`
        );

        if (!response.ok) {
          const error = await response.json();
          console.error("Email verification failed:", error);
          throw new Error("Failed to verify email");
        }

        // Remove token from URL
        router.replace(`/${locale}/sign-in`);
      };

      toast.promise(verifyEmail(), {
        loading: "Verifying email...",
        success: "Email verified successfully",
        error: "Failed to verify email",
      });
    }
  }, [searchParams]);

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
      loading: "Signing in...",
      success: "Successfully signed in",
      error: (error) => error.message || "Failed to sign in",
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-6">
        <h1 className="w-full text-center text-2xl font-semibold">NextGPT</h1>
        <SocialLogins />
        <div className="after:border-border relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t">
          <span className="bg-background text-muted-foreground relative z-10 px-2">
            Or sign in with SSO
          </span>
        </div>
        <SSO />
        <div className="after:border-border relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t">
          <span className="bg-background text-muted-foreground relative z-10 px-2">
            Or continue with
          </span>
        </div>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <div className="grid gap-6">
              <div className="grid gap-2">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
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
                        <FormLabel>Password</FormLabel>
                        <Link
                          className="ml-auto text-sm underline-offset-4 hover:underline"
                          href={`/${locale}/forgot-password`}
                        >
                          Forgot your password?
                        </Link>
                      </div>
                      <FormControl>
                        <Input
                          type="password"
                          placeholder="Your password"
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
                pendingText="Signing in..."
              >
                Sign in
              </SubmitButton>
            </div>
          </form>
        </Form>
        <div className="text-center text-sm">
          Don&apos;t have an account?{" "}
          <Link
            className="underline underline-offset-4"
            href={`/${locale}/sign-up`}
          >
            Sign up
          </Link>
        </div>
      </div>
      <div className="text-muted-foreground hover:[&_a]:text-primary text-balance text-center text-xs [&_a]:underline [&_a]:underline-offset-4">
        By clicking continue, you agree to our <a href="#">Terms of Service</a>{" "}
        and <a href="#">Privacy Policy</a>.
      </div>
    </div>
  );
});
