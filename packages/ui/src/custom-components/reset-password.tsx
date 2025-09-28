import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
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
} from "../components/form.js";
import { Input } from "../components/input.js";
import { useSharedTranslations } from "../contexts/shared-translations-context.js";
import { client } from "../lib/auth-client";
import {
  ResetPasswordFormData,
  resetPasswordFormSchema,
} from "../lib/validations.js";
import { SubmitButton } from "./submit-button.js";

export const ResetPassword = memo(() => {
  const { locale } = useSharedTranslations();

  const router = useRouter();

  const form = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordFormSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  async function onSubmit(values: ResetPasswordFormData) {
    if (values.password !== values.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    const resetPromise = client
      .resetPassword({
        newPassword: values.password,
        token: new URLSearchParams(window.location.search).get("token")!,
      })
      .then((response) => {
        if (response.error) {
          throw new Error(response.error.message);
        }
        router.push(`/${locale}/sign-in`);
        return response;
      });

    toast.promise(resetPromise, {
      loading: "Resetting password...",
      success: "Password reset successfully!",
      error: (error) => error.message || "Failed to reset password",
    });
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="flex w-full flex-col"
      >
        <h1 className="text-2xl font-medium">Reset password</h1>
        <p className="text-sm">Please enter your new password below.</p>
        <div className="mt-6 flex flex-col gap-5 [&>input]:mb-3">
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
            isPending={form.formState.isSubmitting}
            pendingText="Resetting password..."
          >
            Reset password
          </SubmitButton>
        </div>
      </form>
    </Form>
  );
});
