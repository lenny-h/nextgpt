import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useQueryClient } from "@tanstack/react-query";
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
import { apiFetcher } from "../lib/fetcher";
import {
  type CreateProfileData,
  createProfileSchema,
} from "../lib/validations";
import { SubmitButton } from "./submit-button";

export const ProfileForm = memo(() => {
  const { locale, sharedT } = useSharedTranslations();

  const queryClient = useQueryClient();
  const router = useRouter();

  const { data: profile, isPending } = useQuery({
    queryKey: ["profile"],
    queryFn: () =>
      apiFetcher((client) => client.profiles.$get(), sharedT.apiCodes),
  });

  const name = profile?.name;
  const username = profile?.username;

  const form = useForm<CreateProfileData>({
    resolver: zodResolver(createProfileSchema),
    defaultValues: {
      name: name || "",
      username: username || "",
      isPublic: profile ? profile.isPublic : true,
    },
  });

  async function onSubmit(values: CreateProfileData) {
    const updatePromise = apiFetcher(
      (client) =>
        client.profiles.$patch({
          json: {
            name: values.name,
            username: values.username,
            isPublic: values.isPublic,
          },
        }),
      sharedT.apiCodes
    ).then(() => {
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      router.push(`/${locale}/buckets`);
    });

    toast.promise(updatePromise, {
      loading: sharedT.profileForm.updating,
      success: sharedT.profileForm.success,
      error: (error) => `Error updating profile: ${error.message}`,
    });
  }

  return (
    <div className="bg-background flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10">
      <div className="w-full max-w-sm">
        <Form {...form}>
          <form
            className="flex flex-col gap-6"
            onSubmit={form.handleSubmit(onSubmit)}
          >
            <h1 className="text-2xl font-medium">
              {isPending
                ? sharedT.profileForm.loading
                : sharedT.profileForm.update}
            </h1>
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
                    <Input
                      placeholder="John Doe"
                      disabled={isPending}
                      {...field}
                    />
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
                    <Input
                      placeholder="johndoe"
                      disabled={isPending}
                      {...field}
                    />
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
              pendingText={sharedT.profileForm.updating}
            >
              {sharedT.profileForm.update}
            </SubmitButton>
            <Link
              className="text-muted-foreground text-balance text-center text-xs"
              href={`/${locale}`}
            >
              {sharedT.profileForm.goBackHome}
            </Link>
          </form>
        </Form>
      </div>
    </div>
  );
});
