"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { memo, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../components/form.js";
import { Input } from "../components/input.js";
import { useSharedTranslations } from "../contexts/shared-translations-context.js";
import { client } from "../lib/auth-client";
import {
  forgotPasswordFormSchema,
  type ForgotPasswordFormData,
} from "../types/validations.js";
import { SubmitButton } from "./submit-button.js";

export const ForgotPassword = memo(() => {
  const { locale } = useSharedTranslations();
  const [isPending, setIsPending] = useState(false);

  const form = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordFormSchema),
    defaultValues: {
      email: "",
    },
  });

  async function onSubmit(values: ForgotPasswordFormData) {
    setIsPending(true);

    try {
      await client.requestPasswordReset({
        email: values.email,
        redirectTo: `/${locale}/reset-password`,
      });

      toast.success("A password reset link has been sent to your email.");
    } catch (error) {
      console.error("Error sending password reset email:", error);

      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsPending(false);
    }
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
            isPending={isPending}
            pendingText="Sending email..."
          >
            Reset Password
          </SubmitButton>
        </div>
      </form>
    </Form>
  );
});
