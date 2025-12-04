"use client";

import { Selector } from "@/components/custom/selector";
import { useDashboardTranslations } from "@/contexts/dashboard-translations";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@workspace/ui/components/form";
import { Input } from "@workspace/ui/components/input";
import { Textarea } from "@workspace/ui/components/textarea";
import { useSharedTranslations } from "@workspace/ui/contexts/shared-translations-context";
import { SubmitButton } from "@workspace/ui/custom-components/submit-button";
import { apiFetcher } from "@workspace/ui/lib/fetcher";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import {
  type AddModelFormData,
  addModelFormSchema,
  type ModelName,
  modelOptions,
} from "./schema";

export default function AddModelPage() {
  const { locale, sharedT } = useSharedTranslations();
  const { dashboardT } = useDashboardTranslations();
  const queryClient = useQueryClient();
  const router = useRouter();

  const {
    data: buckets,
    error: bucketsError,
    isLoading: bucketsLoading,
  } = useQuery({
    queryKey: ["buckets"],
    queryFn: () =>
      apiFetcher(
        (client) => client["buckets"]["maintained"].$get(),
        sharedT.apiCodes,
      ),
  });

  const form = useForm<AddModelFormData>({
    resolver: zodResolver(addModelFormSchema),
    defaultValues: {
      modelName: undefined,
      resourceName: "",
      deploymentId: "",
      apiKey: "",
      description: "",
    },
  });

  const selectedModel = form.watch("modelName");
  const isAzureModel = selectedModel?.includes("azure");

  async function onSubmit(values: AddModelFormData) {
    const createModelPromise = apiFetcher(
      (client) =>
        client["models"].$post({
          json: { ...values },
        }),
      sharedT.apiCodes,
    ).then(() => {
      queryClient.invalidateQueries({ queryKey: ["models"] });
      router.push(`/${locale}/models`);
    });

    toast.promise(createModelPromise, {
      loading: dashboardT.addModelPage.adding,
      success: dashboardT.addModelPage.success,
      error: dashboardT.addModelPage.error,
    });
  }

  if (bucketsLoading) {
    return (
      <div className="flex h-3/5 flex-col items-center justify-center space-y-8 p-2">
        <Loader2 className="animate-spin" />
      </div>
    );
  }

  if (bucketsError || !buckets) {
    return (
      <div className="flex h-3/5 flex-col items-center justify-center space-y-8 p-2">
        <h1 className="text-2xl font-semibold">
          {dashboardT.addModelPage.errorLoading}
        </h1>
      </div>
    );
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="flex flex-col space-y-6 px-8 py-2"
      >
        <h1 className="w-full text-center text-2xl font-semibold">
          {dashboardT.addModelPage.title}
        </h1>
        <FormField
          control={form.control}
          name="bucketId"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>{dashboardT.addModelPage.bucketLabel}</FormLabel>
              <FormControl>
                <Selector
                  items={buckets}
                  selectedId={field.value}
                  onSelect={(id) => form.setValue("bucketId", id)}
                  isLoading={bucketsLoading}
                  error={bucketsError}
                  placeholder={dashboardT.addModelPage.selectBucket}
                  searchPlaceholder={dashboardT.addModelPage.searchBucket}
                  emptyMessage={dashboardT.addModelPage.noBucketFound}
                  errorMessage={dashboardT.addModelPage.errorLoadingBuckets}
                  noItemsMessage={dashboardT.addModelPage.noBucketsAvailable}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="modelName"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>{dashboardT.addModelPage.modelLabel}</FormLabel>
              <FormControl>
                <Selector
                  items={modelOptions}
                  selectedId={field.value}
                  onSelect={(id) => form.setValue("modelName", id as ModelName)}
                  placeholder={dashboardT.addModelPage.selectModel}
                  searchPlaceholder={dashboardT.addModelPage.searchModel}
                  emptyMessage={dashboardT.addModelPage.noModelFound}
                  errorMessage={dashboardT.addModelPage.errorLoadingModels}
                  noItemsMessage={dashboardT.addModelPage.noModelsAvailable}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        {isAzureModel && (
          <FormField
            control={form.control}
            name="resourceName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{dashboardT.addModelPage.resourceName}</FormLabel>
                <FormControl>
                  <Input className="w-full max-w-80" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}
        {isAzureModel && (
          <FormField
            control={form.control}
            name="deploymentId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{dashboardT.addModelPage.deploymentId}</FormLabel>
                <FormControl>
                  <Input className="w-full max-w-80" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}
        <FormField
          control={form.control}
          name="apiKey"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{dashboardT.addModelPage.apiKey}</FormLabel>
              <FormControl>
                <Input
                  className="w-full max-w-80"
                  type="password"
                  placeholder={dashboardT.addModelPage.apiKeyPlaceholder}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{dashboardT.addModelPage.descriptionLabel}</FormLabel>
              <FormControl>
                <Textarea className="w-full max-w-xl" rows={3} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <SubmitButton
          isPending={form.formState.isSubmitting}
          pendingText={dashboardT.addModelPage.creating}
        >
          {dashboardT.addModelPage.create}
        </SubmitButton>
      </form>
    </Form>
  );
}
