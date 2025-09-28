"use client";

import { z } from "zod";

import { SubmitButton } from "@/components/custom/submit-button";
import { useGlobalTranslations } from "@/contexts/global-translations";
import { rpcFetcher } from "@/lib/fetcher";
import { createClient } from "@/lib/supabase/client";
import { createProfileSchema } from "@/types/validations";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Checkbox } from "@workspace/ui/components/checkbox";
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
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@workspace/ui/components/tooltip";
import { Info } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

export default function ProfilePage() {
  const { locale } = useGlobalTranslations();

  const queryClient = useQueryClient();
  const router = useRouter();

  const { data: profile, isPending } = useQuery({
    queryKey: ["profile"],
    queryFn: () => rpcFetcher<"get_user_profile">("get_user_profile"),
  });

  const name = profile?.[0]?.name;
  const username = profile?.[0]?.username;

  const form = useForm<z.infer<typeof createProfileSchema>>({
    resolver: zodResolver(createProfileSchema),
    defaultValues: {
      name: name || "",
      username: username || "",
      public: profile?.[0] ? profile[0].public : true,
    },
  });

  const mutation = useMutation({
    mutationFn: async (values: z.infer<typeof createProfileSchema>) => {
      const supabase = createClient();
      const { error } = await supabase.rpc(
        profile?.[0] ? "update_profile" : "create_profile",
        {
          p_name: values.name,
          p_username: values.username,
          p_public: values.public,
        }
      );
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      router.push(`/${locale}`);
      toast.success(
        profile?.[0]
          ? "Profile updated successfully 🎉"
          : "Profile created successfully 🎉"
      );
    },
    onError: () => {
      toast.error(
        profile?.[0] ? "Error updating profile" : "Error creating profile"
      );
    },
  });

  async function onSubmit(values: z.infer<typeof createProfileSchema>) {
    mutation.mutate(values);
  }

  return (
    <div className="min-h-svh flex flex-col items-center justify-center gap-6 bg-background p-6 md:p-10">
      <div className="w-full max-w-sm">
        <Form {...form}>
          <form
            className="flex flex-col gap-6"
            onSubmit={form.handleSubmit(onSubmit)}
          >
            <h1 className="text-2xl font-medium">
              {isPending
                ? "Loading..."
                : profile?.[0]
                  ? "Update profile"
                  : "Create profile"}
            </h1>
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <div className="flex justify-between items-center">
                    <FormLabel htmlFor="name">Name</FormLabel>
                    <div className="hidden md:flex items-center space-x-2">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Info className="size-5 text-primary" />
                          </TooltipTrigger>
                          <TooltipContent>
                            The name is visible to other users. It is used to
                            address you inside the app.
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                      <span className="text-sm text-primary">Public</span>
                    </div>
                  </div>
                  <FormControl>
                    <Input placeholder="Boss" disabled={isPending} {...field} />
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
                  <div className="flex justify-between items-center">
                    <FormLabel htmlFor="username">Username</FormLabel>
                    <div className="hidden md:flex items-center space-x-2">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Info className="size-5 text-primary" />
                          </TooltipTrigger>
                          <TooltipContent>
                            The username is visible to other users. This is
                            required so that they can send you invitations.
                            Usernames must be unique.
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                      <span className="text-sm text-primary">Public</span>
                    </div>
                  </div>
                  <FormControl>
                    <Input placeholder="Hugo" disabled={isPending} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="public"
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
              isPending={isPending}
              pendingText="Creating profile..."
            >
              {profile?.[0] ? "Update profile" : "Create profile"}
            </SubmitButton>
            <Link
              className="text-balance text-center text-xs text-muted-foreground"
              href={`/${locale}`}
            >
              {profile?.[0] ? "Back to chat" : "Skip for now"}
            </Link>
          </form>
        </Form>
      </div>
    </div>
  );
}
