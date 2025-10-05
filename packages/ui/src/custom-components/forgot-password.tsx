"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
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
import { client } from "../lib/auth-client";
import {
  forgotPasswordFormSchema,
  type ForgotPasswordFormData,
} from "../lib/validations";
import { SubmitButton } from "./submit-button";

export const ForgotPassword = memo(() => {
  const { locale } = useSharedTranslations();

  const form = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordFormSchema),
    defaultValues: {
      email: "",
    },
  });

  async function onSubmit(values: ForgotPasswordFormData) {
    const resetPromise = client
      .requestPasswordReset({
        email: values.email,
        redirectTo: `/${locale}/reset-password`,
      })
      .then((response) => {
        if (response.error) {
          throw new Error(response.error.message);
        }
        return response;
      });

    toast.promise(resetPromise, {
      loading: "Sending email...",
      success: "A password reset link has been sent to your email.",
      error: (error) => error.message || "Failed to send reset email",
    });
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="flex w-full flex-col"
      >
        <h1 className="text-2xl font-medium">Reset password</h1>
        <p className="text-sm">
          Back to sign in?{" "}
          <Link
            className="text-primary font-medium underline"
            href={`/${locale}/sign-in`}
          >
            Sign in
          </Link>
        </p>
        <div className="mt-6 flex flex-col gap-5 [&>input]:mb-3">
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
          <SubmitButton
            className="w-full"
            isPending={form.formState.isSubmitting}
            pendingText="Sending email..."
          >
            Reset Password
          </SubmitButton>
        </div>
      </form>
    </Form>
  );
});
