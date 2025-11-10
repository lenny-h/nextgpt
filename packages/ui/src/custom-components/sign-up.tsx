"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Info } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { memo } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Checkbox } from "../components/checkbox";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../components/form";
import { Input } from "../components/input";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../components/tooltip";
import { useSharedTranslations } from "../contexts/shared-translations-context";
import { signUp } from "../lib/auth-client";
import { signUpFormSchema, type SignUpFormData } from "../lib/validations";
import { SocialLogins } from "./social-logins";
import { SubmitButton } from "./submit-button";

export const SignUp = memo(() => {
  const { locale } = useSharedTranslations();
  const router = useRouter();

  const form = useForm<SignUpFormData>({
    resolver: zodResolver(signUpFormSchema),
    defaultValues: {
      email: "",
      password: "",
      name: "",
      username: "",
      isPublic: true,
    },
  });

  async function onSubmit(values: SignUpFormData) {
    const signUpPromise = signUp.email({
      name: values.name,
      email: values.email,
      password: values.password,
      username: values.username,
      isPublic: values.isPublic,
      callbackURL: `/${locale}`,
      fetchOptions: {
        onError: (ctx) => {
          throw new Error(ctx.error.message);
        },
        onSuccess: async () => {
          router.push(`/${locale}/sign-in`);
        },
      },
    });

    toast.promise(signUpPromise, {
      loading: "Signing up...",
      success: "Successfully signed up. Please confirm your email.",
      error: (error) => error.message || "Failed to sign up",
    });
  }

  return (
    <div className="flex w-full flex-col gap-6">
      <div className="grid gap-6">
        <div>
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
        </div>
        <SocialLogins />
        <div className="after:border-border relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t">
          <span className="bg-background text-muted-foreground relative z-10 px-2">
            Or continue with
          </span>
        </div>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex w-full flex-col"
          >
            <div className="flex flex-col gap-5 [&>input]:mb-3">
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
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center justify-between">
                      <FormLabel htmlFor="name">Name</FormLabel>
                      <div className="hidden items-center space-x-1 md:flex">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Info className="text-primary size-4" />
                            </TooltipTrigger>
                            <TooltipContent>
                              The name is only used to address you inside the
                              app.
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                        <span className="text-primary text-sm">Private</span>
                      </div>
                    </div>
                    <FormControl>
                      <Input placeholder="Boss" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center justify-between">
                      <FormLabel htmlFor="username">Username</FormLabel>
                      <div className="hidden items-center space-x-1 md:flex">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Info className="text-primary size-4" />
                            </TooltipTrigger>
                            <TooltipContent>
                              The username is visible to other users. This is
                              required so that they can send you invitations.
                              Usernames must be unique.
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                        <span className="text-primary text-sm">Public</span>
                      </div>
                    </div>
                    <FormControl>
                      <Input placeholder="Hugo" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="isPublic"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 shadow">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Let other people invite you</FormLabel>
                    </div>
                  </FormItem>
                )}
              />
              <SubmitButton
                className="w-full"
                isPending={form.formState.isSubmitting}
                pendingText="Signing up..."
              >
                Sign up
              </SubmitButton>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
});
