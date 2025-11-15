import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { memo } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../components/form";
import { Input } from "../components/input";
import { Textarea } from "../components/textarea";
import { useSharedTranslations } from "../contexts/shared-translations-context";
import { apiFetcher } from "../lib/fetcher";
import { feedbackSchema, type FeedbackFormData } from "../lib/validations";
import { SubmitButton } from "./submit-button";

export const FeedbackForm = memo(() => {
  const { locale, sharedT } = useSharedTranslations();

  const router = useRouter();

  const form = useForm<FeedbackFormData>({
    resolver: zodResolver(feedbackSchema),
    defaultValues: {
      subject: "",
      content: "",
    },
  });

  async function onSubmit(values: FeedbackFormData) {
    const feedbackPromise = apiFetcher(
      (client) =>
        client.feedback.$post({
          json: values,
        }),
      sharedT.apiCodes
    ).then(() => {
      router.push(`/${locale}`);
    });

    toast.promise(feedbackPromise, {
      loading: sharedT.feedbackForm.submitting,
      success: sharedT.feedbackForm.success,
      error: (error) => `Error submitting feedback: ${error.message}`,
    });
  }

  return (
    <div className="bg-background flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10">
      <div className="w-full max-w-sm">
        <Form {...form}>
          <form
            className="flex w-full flex-col"
            onSubmit={form.handleSubmit(onSubmit)}
          >
            <h1 className="text-2xl font-medium">
              {sharedT.feedbackForm.title}
            </h1>
            <p className="text-muted-foreground text-sm">
              {sharedT.feedbackForm.description}
            </p>
            <div className="mt-6 flex flex-col gap-5 [&>input]:mb-3">
              <FormField
                control={form.control}
                name="subject"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{sharedT.feedbackForm.subject}</FormLabel>
                    <FormControl>
                      <Input
                        placeholder={sharedT.feedbackForm.subjectPlaceholder}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="content"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{sharedT.feedbackForm.content}</FormLabel>
                    <FormControl>
                      <Textarea
                        className="max-h-80 min-h-32"
                        placeholder={sharedT.feedbackForm.contentPlaceholder}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <SubmitButton
                className="w-full"
                isPending={form.formState.isSubmitting}
                pendingText={sharedT.feedbackForm.submitting}
              >
                {sharedT.feedbackForm.submit}
              </SubmitButton>
              <Link
                className="text-muted-foreground text-balance text-center text-xs"
                href={`/${locale}`}
              >
                {sharedT.feedbackForm.backToHome}
              </Link>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
});
