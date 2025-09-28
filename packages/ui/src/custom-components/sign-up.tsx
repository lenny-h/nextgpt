"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
import { signUp } from "../lib/auth-client";
import { type SignUpFormData, signUpFormSchema } from "../types/validations.js";
import { SubmitButton } from "./submit-button.js";

export const SignUp = memo(() => {
  const { locale } = useSharedTranslations();
  const router = useRouter();

  const [isPending, setIsPending] = useState(false);

  const form = useForm<SignUpFormData>({
    resolver: zodResolver(signUpFormSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  async function onSubmit(values: SignUpFormData) {
    setIsPending(true);

    const res = await signUp.email({
      name: "",
      email: values.email,
      password: values.password,
      callbackURL: `/${locale}`,
      fetchOptions: {
        onError: (ctx) => {
          toast.error(ctx.error.message);
        },
        onSuccess: async () => {
          toast.success("Successfully signed up. Please confirm your email.");
          router.push(`/${locale}/sign-in`);
        },
      },
    });

    // TODO:
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="flex w-full flex-col"
      >
        <h1 className="text-2xl font-medium">Sign up</h1>
        <p className="text-sm">
          Already have an account?{" "}
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
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Password</FormLabel>
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
          <SubmitButton
            className="w-full"
            isPending={isPending}
            pendingText="Signing up..."
          >
            Sign up
          </SubmitButton>
        </div>
      </form>
    </Form>
  );
});
