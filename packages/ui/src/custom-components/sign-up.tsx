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
import { SubmitButton } from "./submit-button";

export const SignUp = memo(() => {
  const { locale, sharedT } = useSharedTranslations();
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
      callbackURL: `${window.location.origin}/${locale}`,
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
      loading: sharedT.signUp.signingUp,
      success: sharedT.signUp.success,
      error: (error) => error.message || sharedT.signUp.error,
    });
  }

  return (
    <div className="flex w-full flex-col gap-6">
      <div className="grid gap-6">
        <div>
          <h1 className="text-2xl font-medium">{sharedT.signUp.title}</h1>
          <p className="text-sm">
            {sharedT.signUp.alreadyHaveAccount}{" "}
            <Link
              className="underline underline-offset-4"
              href={`/${locale}/sign-in`}
            >
              {sharedT.signUp.signInText}
            </Link>
          </p>
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
                    <FormLabel>{sharedT.signIn.emailLabel}</FormLabel>
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
                    <FormLabel>{sharedT.signIn.passwordLabel}</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder={sharedT.signIn.passwordPlaceholder}
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
                      <FormLabel htmlFor="name">
                        {sharedT.profileForm.name}
                      </FormLabel>
                      <div className="hidden items-center space-x-1 md:flex">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Info className="text-primary size-4" />
                            </TooltipTrigger>
                            <TooltipContent>
                              {sharedT.profileForm.nameTooltip}
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                        <span className="text-primary text-sm">
                          {sharedT.profileForm.privateLabel}
                        </span>
                      </div>
                    </div>
                    <FormControl>
                      <Input placeholder="John Doe" {...field} />
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
                      <FormLabel htmlFor="username">
                        {sharedT.profileForm.username}
                      </FormLabel>
                      <div className="hidden items-center space-x-1 md:flex">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Info className="text-primary size-4" />
                            </TooltipTrigger>
                            <TooltipContent>
                              {sharedT.profileForm.usernameTooltip}
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                        <span className="text-primary text-sm">
                          {sharedT.profileForm.publicLabel}
                        </span>
                      </div>
                    </div>
                    <FormControl>
                      <Input placeholder="johndoe" {...field} />
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
                      <FormLabel>{sharedT.profileForm.letInvite}</FormLabel>
                    </div>
                  </FormItem>
                )}
              />
              <SubmitButton
                className="w-full"
                isPending={form.formState.isSubmitting}
                pendingText={sharedT.signUp.signingUp}
              >
                {sharedT.signUp.signUpButton}
              </SubmitButton>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
});
