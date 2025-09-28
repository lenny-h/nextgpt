"use client";

import { SubmitButton } from "@/components/custom/submit-button";
import { useGlobalTranslations } from "@/contexts/global-translations";
import { createClient } from "@/lib/supabase/client";
import { type FeedbackFormData, feedbackSchema } from "@/types/validations";
import { zodResolver } from "@hookform/resolvers/zod";
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
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

export default function FeedbackPage() {
  const { locale } = useGlobalTranslations();
  const router = useRouter();

  const [isPending, setIsPending] = useState(false);

  const form = useForm<FeedbackFormData>({
    resolver: zodResolver(feedbackSchema),
    defaultValues: {
      subject: "",
      content: "",
    },
  });

  async function onSubmit(values: FeedbackFormData) {
    setIsPending(true);

    const supabase = createClient();

    const { error } = await supabase.rpc("insert_feedback", {
      p_subject: values.subject,
      p_content: values.content,
    });

    setIsPending(false);

    if (error) {
      toast.error(
        "An error occurred while submitting your feedback. Please try again."
      );
    } else {
      toast.success("Thank you for your feedback! We appreciate your input.");

      router.push(`/${locale}`);
    }
  }

  return (
    <div className="min-h-svh flex flex-col items-center justify-center gap-6 bg-background p-6 md:p-10">
      <div className="w-full max-w-sm">
        <Form {...form}>
          <form
            className="w-full flex flex-col"
            onSubmit={form.handleSubmit(onSubmit)}
          >
            <h1 className="text-2xl font-medium">Feedback</h1>
            <p className="text-sm text-muted-foreground">
              We value your feedback! Please share your thoughts with us. You
              can also request a new feature or report a bug.
            </p>
            <div className="flex flex-col gap-5 [&>input]:mb-3 mt-6">
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
                        className="min-h-32 max-h-80"
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
                isPending={isPending}
                pendingText="Submitting..."
              >
                Submit
              </SubmitButton>
              <Link
                className="text-balance text-center text-xs text-muted-foreground"
                href={`/${locale}`}
              >
                Back to dashboard
              </Link>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
}
