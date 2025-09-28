"use client";

import * as z from "zod";

import { useGlobalTranslations } from "@/contexts/global-translations";
import { bucketSubscriptions } from "@/lib/bucket-subscriptions";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@workspace/ui/components/button";
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
import { checkResponse } from "@workspace/ui/lib/translation-utils";
import { cn } from "@workspace/ui/lib/utils";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { CreateBucketFormData, createBucketFormSchema } from "./schema";

export default function CreateBucketPage() {
  const { locale, globalT } = useGlobalTranslations();

  const queryClient = useQueryClient();
  const router = useRouter();

  const [selectedType, setSelectedType] = useState(0);

  const form = useForm<CreateBucketFormData>({
    resolver: zodResolver(createBucketFormSchema),
    defaultValues: {
      bucketName: "",
    },
  });

  const mutation = useMutation({
    mutationFn: async (values: CreateBucketFormData) => {
      const subscription = bucketSubscriptions[selectedType];
      if (!subscription) {
        throw new Error("Invalid subscription type selected.");
      }
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/capi/protected/buckets`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            values,
            type: subscription.type.toLowerCase(),
          }),
        },
      );
      checkResponse(response, globalT.globalErrors);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["buckets"] });
      router.push(`/${locale}/buckets`);
      toast.success("Bucket created successfully 🎉");
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : globalT.globalErrors.error,
      );
    },
  });

  async function onSubmit(values: z.infer<typeof createBucketFormSchema>) {
    mutation.mutate(values);
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
            <Button
              type="submit"
              disabled={mutation.isPending}
              className="mx-auto"
            >
              Continue to payment
              {mutation.isPending && <Loader2 className="animate-spin" />}
            </Button>
          </>
        )}
      </form>
    </Form>
  );
}
