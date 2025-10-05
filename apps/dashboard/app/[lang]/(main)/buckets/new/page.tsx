"use client";

import * as z from "zod";

import { bucketSubscriptions } from "@/lib/bucket-subscriptions";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { BucketType } from "@workspace/server/drizzle/schema";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@workspace/ui/components/form";
import { Input } from "@workspace/ui/components/input";
import { Separator } from "@workspace/ui/components/separator";
import { useSharedTranslations } from "@workspace/ui/contexts/shared-translations-context";
import { SubmitButton } from "@workspace/ui/custom-components/submit-button";
import { apiFetcher } from "@workspace/ui/lib/fetcher";
import { cn } from "@workspace/ui/lib/utils";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { CreateBucketFormData, createBucketFormSchema } from "./schema";

export default function CreateBucketPage() {
  const { locale, sharedT } = useSharedTranslations();

  const queryClient = useQueryClient();
  const router = useRouter();

  const [selectedType, setSelectedType] = useState(0);

  const form = useForm<CreateBucketFormData>({
    resolver: zodResolver(createBucketFormSchema),
    defaultValues: {
      bucketName: "",
    },
  });

  async function onSubmit(values: z.infer<typeof createBucketFormSchema>) {
    const subscription = bucketSubscriptions[selectedType];
    if (!subscription) {
      toast.error("Invalid subscription type selected.");
      return;
    }

    const createBucketPromise = apiFetcher(
      (client) =>
        client["buckets"].$post({
          json: {
            values,
            type: subscription.type.toLowerCase() as
              | "small"
              | "medium"
              | "large",
          },
        }),
      sharedT.apiCodes,
    ).then(() => {
      queryClient.invalidateQueries({ queryKey: ["buckets"] });
      router.push(`/${locale}/buckets`);
    });

    toast.promise(createBucketPromise, {
      loading: "Creating bucket...",
      success: "Bucket created successfully 🎉",
      error: (error) => `Error creating bucket: ${error.message}`,
    });
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="flex flex-col space-y-6 px-8 py-2"
      >
        <h1 className="w-full text-center text-2xl font-semibold">
          Create a bucket
        </h1>
        <FormField
          control={form.control}
          name="bucketName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Bucket name</FormLabel>
              <FormControl>
                <Input
                  className="w-full max-w-80"
                  placeholder="My organization bucket"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <h2 className="text-xl font-semibold">Select a type</h2>
        <div className="grid w-full max-w-7xl grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {bucketSubscriptions.map((subscription, index) => (
            <button
              type="button"
              key={subscription.type}
              className={cn(
                "border-3 flex size-full cursor-pointer flex-col items-start space-y-4 rounded-md p-3 shadow-lg",
                selectedType === index && "border-primary",
              )}
              onClick={() => setSelectedType(index)}
            >
              <div className="flex w-full items-center justify-between">
                <h3 className="text-lg font-semibold">{subscription.type}</h3>
                {subscription.type === "University" ? (
                  <p className="text-sm font-semibold">Custom</p>
                ) : (
                  <p className="text-sm font-semibold">
                    ${subscription.price}/month
                  </p>
                )}
              </div>
              <p className="text-left text-sm">{subscription.description}</p>
              <Separator orientation="horizontal" />
              <ul className="list-disc pl-4 text-left">
                <li className="text-muted-foreground font-medium">
                  Capacity:{" "}
                  <span className="text-primary">
                    {subscription.type === "University"
                      ? "Custom"
                      : `${subscription.capacity} users`}
                  </span>
                </li>
                <li className="text-muted-foreground font-medium">
                  Max file size:{" "}
                  <span className="text-primary">
                    {subscription.type === "University"
                      ? "Custom"
                      : `${subscription.maxFileSize} GB`}
                  </span>
                </li>
              </ul>
            </button>
          ))}
        </div>
        {selectedType === 3 ? (
          <h2 className="mt-12 text-center text-xl font-semibold">
            To create a university cluster, please get in touch with us
          </h2>
        ) : (
          <>
            <h2 className="mt-12 text-center text-xl font-semibold">
              Users can be added after the bucket has been created
            </h2>
            <SubmitButton
              isPending={form.formState.isSubmitting}
              pendingText="Processing..."
            >
              Continue to payment
            </SubmitButton>
          </>
        )}
      </form>
    </Form>
  );
}
