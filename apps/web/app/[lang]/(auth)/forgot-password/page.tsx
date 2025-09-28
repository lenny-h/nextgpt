"use client";

import { forgotPasswordAction } from "@/actions";
import { SubmitButton } from "@/components/custom/submit-button";
import { useGlobalTranslations } from "@/contexts/global-translations";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@workspace/ui/components/form";
import { Input } from "@workspace/ui/components/input";
import {
  type ForgotPasswordFormData,
  forgotPasswordFormSchema,
} from "@workspace/ui/types/validations";
import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

export default function ForgotPassword() {
  const { locale } = useGlobalTranslations();
  const [isPending, setIsPending] = useState(false);

  const form = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordFormSchema),
    defaultValues: {
      email: "",
    },
  });

  async function onSubmit(values: ForgotPasswordFormData) {
    setIsPending(true);
    const { success, message } = await forgotPasswordAction(values);
    setIsPending(false);

    if (success) {
      toast.success(message);
    } else {
      toast.error(message);
    }
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="w-full flex flex-col"
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
        <div className="flex flex-col gap-5 [&>input]:mb-3 mt-6">
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
}
