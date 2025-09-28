"use client";

import { resetPasswordAction } from "@/actions";
import { SubmitButton } from "@/components/custom/submit-button";
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
  ResetPasswordFormData,
  resetPasswordFormSchema,
} from "@workspace/ui/types/validations";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

export default function ResetPassword() {
  const [isPending, setIsPending] = useState(false);

  const form = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordFormSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  async function onSubmit(values: ResetPasswordFormData) {
    setIsPending(true);
    const { success, message } = await resetPasswordAction(values);
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
        <p className="text-sm">Please enter your new password below.</p>
        <div className="flex flex-col gap-5 [&>input]:mb-3 mt-6">
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Password</FormLabel>
                <FormControl>
                  <Input placeholder="New password" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="confirmPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Confirm password</FormLabel>
                <FormControl>
                  <Input placeholder="Confirm password" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <SubmitButton
            className="w-full"
            isPending={isPending}
            pendingText="Resetting password..."
          >
            Reset password
          </SubmitButton>
        </div>
      </form>
    </Form>
  );
}
