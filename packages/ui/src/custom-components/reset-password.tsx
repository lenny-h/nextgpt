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
} from "../components/form";
import { Input } from "../components/input";
import { useSharedTranslations } from "../contexts/shared-translations-context";
import { client } from "../lib/auth-client";
import {
  resetPasswordFormSchema,
  type ResetPasswordFormData,
} from "../lib/validations";
import { SubmitButton } from "./submit-button";

export const ResetPassword = memo(() => {
  const { locale, sharedT } = useSharedTranslations();

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
      toast.error(sharedT.resetPassword.passwordsDontMatch);
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
      loading: sharedT.resetPassword.resetting,
      success: sharedT.resetPassword.success,
      error: (error) =>
        error.message ||
        sharedT.resetPassword.error ||
        "Failed to reset password",
    });
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="flex w-full flex-col"
      >
        <h1 className="text-2xl font-medium">{sharedT.resetPassword.title}</h1>
        <p className="text-sm">{sharedT.resetPassword.description}</p>
        <div className="mt-6 flex flex-col gap-5 [&>input]:mb-3">
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{sharedT.resetPassword.password}</FormLabel>
                <FormControl>
                  <Input
                    placeholder={sharedT.resetPassword.passwordPlaceholder}
                    {...field}
                  />
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
                <FormLabel>{sharedT.resetPassword.confirmPassword}</FormLabel>
                <FormControl>
                  <Input
                    placeholder={
                      sharedT.resetPassword.confirmPasswordPlaceholder
                    }
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <SubmitButton
            className="w-full"
            isPending={form.formState.isSubmitting}
            pendingText={sharedT.resetPassword.resetting}
          >
            {sharedT.resetPassword.resetButton}
          </SubmitButton>
        </div>
      </form>
    </Form>
  );
});
