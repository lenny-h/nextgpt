"use client";

import { signUpAction } from "@/actions";
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
  type SignUpFormData,
  signUpFormSchema,
} from "@workspace/ui/types/validations";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

export default function Signup() {
  const { locale } = useGlobalTranslations();
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
    const { success, message } = await signUpAction(values);
    setIsPending(false);

    if (success) {
      toast.success(message);
      router.push(`/${locale}/sign-in`);
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
}
