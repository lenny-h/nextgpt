"use client";

import { signInAction } from "@/actions";
import { SocialLogins } from "@/components/custom/social-logins";
import { SubmitButton } from "@/components/custom/submit-button";
import { useGlobalTranslations } from "@/contexts/global-translations";
import { createClient } from "@/lib/supabase/client";
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
  SignInFormData,
  signInFormSchema,
} from "@workspace/ui/types/validations";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

export default function SignInPage() {
  const { locale } = useGlobalTranslations();
  const [isPending, setIsPending] = useState(false);

  const router = useRouter();

  const form = useForm<SignInFormData>({
    resolver: zodResolver(signInFormSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  async function onSubmit(values: SignInFormData) {
    setIsPending(true);
    const { success, message } = await signInAction(values);
    setIsPending(false);

    if (success) {
      toast.success(message);

      const supabase = createClient();

      const { data: profile, error: profileError } =
        await supabase.rpc("get_user_profile");

      if (!profileError && !profile?.[0]) {
        router.push("/profile");
      } else {
        router.push("/");
      }
    } else {
      toast.error(message);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-6">
        <h1 className="w-full text-center text-2xl font-semibold">NextGPT</h1>
        <SocialLogins />
        <div className="relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t after:border-border">
          <span className="relative z-10 bg-background px-2 text-muted-foreground">
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
                isPending={isPending}
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
      <div className="text-balance text-center text-xs text-muted-foreground [&_a]:underline [&_a]:underline-offset-4 hover:[&_a]:text-primary">
        By clicking continue, you agree to our <a href="#">Terms of Service</a>{" "}
        and <a href="#">Privacy Policy</a>.
      </div>
    </div>
  );
}
