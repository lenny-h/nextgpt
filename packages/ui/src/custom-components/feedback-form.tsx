import { memo } from "react";
import { useSharedTranslations } from "../contexts/shared-translations-context";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { feedbackSchema, type FeedbackFormData } from "../lib/validations";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { apiFetcher } from "../lib/fetcher";
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
import { SubmitButton } from "./submit-button";
import Link from "next/link";

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
      "feedback",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(values),
      },
      sharedT.apiCodes
    ).then(() => {
      router.push(`/${locale}`);
    });

    toast.promise(feedbackPromise, {
      loading: "Submitting...",
      success: "Thank you for your feedback! We appreciate your input.",
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
            <h1 className="text-2xl font-medium">Feedback</h1>
            <p className="text-muted-foreground text-sm">
              We value your feedback! Please share your thoughts with us. You
              can also request a new feature or report a bug.
            </p>
            <div className="mt-6 flex flex-col gap-5 [&>input]:mb-3">
              <FormField
                control={form.control}
                name="subject"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Subject</FormLabel>
                    <FormControl>
                      <Input placeholder="Subject" {...field} />
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
                    <FormLabel>Content</FormLabel>
                    <FormControl>
                      <Textarea
                        className="max-h-80 min-h-32"
                        placeholder="Describe your feedback here..."
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
                pendingText="Submitting..."
              >
                Submit
              </SubmitButton>
              <Link
                className="text-muted-foreground text-balance text-center text-xs"
                href={`/${locale}`}
              >
                Back to home
              </Link>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
});
