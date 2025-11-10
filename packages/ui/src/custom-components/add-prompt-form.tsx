import * as z from "zod";

import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@workspace/ui/components/button";
import { DialogFooter } from "@workspace/ui/components/dialog";
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
import { SubmitButton } from "@workspace/ui/custom-components/submit-button";
import { apiFetcher } from "@workspace/ui/lib/fetcher";
import { memo } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { useSharedTranslations } from "../contexts/shared-translations-context";

export const promptFormSchema = z.object({
  name: z.string().min(1, "Name is required").max(64, "Name is too long"),
  content: z
    .string()
    .min(1, "Content is required")
    .max(512, "Content must be less than 512 characters"),
});

export type PromptFormData = z.infer<typeof promptFormSchema>;

interface AddPromptFormProps {
  onClose: () => void;
}

export const AddPromptForm = memo(({ onClose }: AddPromptFormProps) => {
  const { sharedT } = useSharedTranslations();

  const queryClient = useQueryClient();

  const form = useForm<PromptFormData>({
    resolver: zodResolver(promptFormSchema),
    defaultValues: {
      name: "",
      content: "",
    },
  });

  async function onSubmit(values: PromptFormData) {
    const createPromptPromise = apiFetcher(
      (client) =>
        client["prompts"].$post({
          json: {
            name: values.name,
            content: values.content,
          },
        }),
      sharedT.apiCodes
    ).then(() => {
      queryClient.invalidateQueries({ queryKey: ["prompts"] });
      onClose();
    });

    toast.promise(createPromptPromise, {
      loading: "Creating prompt...",
      success: "Prompt created successfully 🎉",
      error: (error) => `Error creating prompt: ${error.message}`,
    });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <div className="grid gap-4 py-2">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{sharedT.addPromptForm.name}</FormLabel>
                <FormControl>
                  <Input
                    placeholder={sharedT.addPromptForm.promptName}
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
                <FormLabel>{sharedT.addPromptForm.content}</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder={sharedT.addPromptForm.contentPlaceholder}
                    className="min-h-32"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <DialogFooter className="mt-4">
          <Button type="button" variant="secondary" onClick={onClose}>
            {sharedT.addPromptForm.cancel}
          </Button>
          <SubmitButton
            isPending={form.formState.isSubmitting}
            pendingText="Creating..."
          >
            {sharedT.addPromptForm.create}
          </SubmitButton>
        </DialogFooter>
      </form>
    </Form>
  );
});
