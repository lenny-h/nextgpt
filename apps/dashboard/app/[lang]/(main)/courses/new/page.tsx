"use client";

import { z } from "zod";

import { Selector } from "@/components/custom/selector";
import { useGlobalTranslations } from "@/contexts/global-translations";
import { rpcFetcher } from "@/lib/fetcher";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
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
import { Textarea } from "@workspace/ui/components/textarea";
import { checkResponse } from "@workspace/ui/lib/translation-utils";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { createCourseFormSchema } from "./schema";

export default function CreateCoursePage() {
  const { locale, globalT } = useGlobalTranslations();

  const queryClient = useQueryClient();
  const router = useRouter();

  const {
    data: buckets,
    error: bucketsError,
    isLoading: bucketsLoading,
  } = useQuery({
    queryKey: ["buckets"],
    queryFn: () =>
      rpcFetcher<"get_maintained_buckets">("get_maintained_buckets"),
  });

  const mutation = useMutation({
    mutationFn: async (values: z.infer<typeof createCourseFormSchema>) => {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/capi/protected/courses`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({ values }),
        },
      );
      checkResponse(response, globalT.globalErrors);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["courses"] });
      router.push(`/${locale}/courses`);
      toast.success(
        "Course created successfully 🎉\n Add course maintainers by clicking on the three dots",
      );
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : globalT.globalErrors.error,
      );
    },
  });

  const form = useForm<z.infer<typeof createCourseFormSchema>>({
    resolver: zodResolver(createCourseFormSchema),
    defaultValues: {
      courseName: "",
      courseDescription: "",
      password: "",
    },
  });

  async function onSubmit(values: z.infer<typeof createCourseFormSchema>) {
    mutation.mutate(values);
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
          There was an error loading the buckets. Please try again later.
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
          Create a course
        </h1>
        <FormField
          control={form.control}
          name="bucketId"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Bucket</FormLabel>
              <FormControl>
                <Selector
                  items={buckets}
                  selectedId={field.value}
                  onSelect={(id) => form.setValue("bucketId", id)}
                  isLoading={bucketsLoading}
                  error={bucketsError}
                  placeholder="Select bucket"
                  searchPlaceholder="Search bucket..."
                  emptyMessage="No bucket found"
                  errorMessage="There was an error loading the buckets"
                  noItemsMessage="No buckets available"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="courseName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Course name</FormLabel>
              <FormControl>
                <Input
                  className="w-full max-w-80"
                  placeholder="Analysis I"
                  {...field}
                />
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
              <FormLabel>Course password (Optional)</FormLabel>
              <FormControl>
                <Input
                  type="password"
                  className="w-full max-w-80"
                  placeholder="Enter password for course access"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="courseDescription"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Course description (Optional)</FormLabel>
              <FormControl>
                <Textarea
                  className="w-full max-w-2xl"
                  rows={5}
                  placeholder="This course covers... It is a 5 ECTS course... and takes place in the Spring semester. It requires the following prerequisites..."
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" disabled={mutation.isPending} className="mx-auto">
          Create
          {mutation.isPending && <Loader2 className="ml-2 animate-spin" />}
        </Button>
      </form>
    </Form>
  );
}
