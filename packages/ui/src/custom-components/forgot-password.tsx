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
  const { locale, sharedT } = useSharedTranslations();

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
      loading: sharedT.forgotPassword.sendingEmail,
      success: sharedT.forgotPassword.success,
      error: (error) =>
        error.message ||
        sharedT.forgotPassword.errorSending ||
        "Failed to send reset email",
    });
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="flex w-full flex-col"
      >
        <h1 className="text-2xl font-medium">{sharedT.forgotPassword.title}</h1>
        <p className="text-sm">
          {sharedT.forgotPassword.backToSignIn}{" "}
          <Link
            className="text-primary font-medium underline"
            href={`/${locale}/sign-in`}
          >
            {sharedT.forgotPassword.signIn}
          </Link>
        </p>
        <div className="mt-6 flex flex-col gap-5 [&>input]:mb-3">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{sharedT.forgotPassword.email}</FormLabel>
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
            pendingText={sharedT.forgotPassword.sendingEmail}
          >
            {sharedT.forgotPassword.resetButton}
          </SubmitButton>
        </div>
      </form>
    </Form>
  );
});
