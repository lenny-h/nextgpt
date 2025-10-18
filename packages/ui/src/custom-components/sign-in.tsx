"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
import { client, signIn } from "../lib/auth-client";
import { signInFormSchema, type SignInFormData } from "../lib/validations";
import { SocialLogins } from "./social-logins";
import { SubmitButton } from "./submit-button";

export const SignIn = memo(() => {
  const { locale } = useSharedTranslations();

  const router = useRouter();

  // useEffect(() => {
  //   client.oneTap({
  //     fetchOptions: {
  //       onError: ({ error }) => {
  //         toast.error(error.message || "An error occurred");
  //       },
  //       onSuccess: () => {
  //         toast.success("Successfully signed in");
  //         router.push(`/${locale}`);
  //       },
  //     },
  //   });
  // }, []);

  const form = useForm<SignInFormData>({
    resolver: zodResolver(signInFormSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  async function onSubmit(values: SignInFormData) {
    const signInPromise = signIn
      .email({
        email: values.email,
        password: values.password,
        rememberMe: true,
      })
      .then(async () => {
        router.push(`/${locale}`);
      });

    toast.promise(signInPromise, {
      loading: "Signing in...",
      success: "Successfully signed in",
      error: "Something went wrong. Please try again.",
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-6">
        <h1 className="w-full text-center text-2xl font-semibold">NextGPT</h1>
        <SocialLogins />
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
