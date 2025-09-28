import * as z from "zod";

import { useGlobalTranslations } from "@/contexts/global-translations";
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
import { checkResponse } from "@workspace/ui/lib/translation-utils";
import { Loader2 } from "lucide-react";
import { memo } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

const promptFormSchema = z.object({
  name: z.string().min(1, "Name is required").max(64, "Name is too long"),
  content: z
    .string()
    .min(1, "Content is required")
    .max(512, "Content must be less than 512 characters"),
});

type PromptFormData = z.infer<typeof promptFormSchema>;

interface AddPromptFormProps {
  onClose: () => void;
}

export const AddPromptForm = memo(({ onClose }: AddPromptFormProps) => {
  const { globalT } = useGlobalTranslations();
  const queryClient = useQueryClient();

  const form = useForm<PromptFormData>({
    resolver: zodResolver(promptFormSchema),
    defaultValues: {
      name: "",
      content: "",
    },
  });

  async function onSubmit(values: PromptFormData) {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/capi/protected/prompts`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          name: values.name,
          content: values.content,
        }),
      },
    );

    checkResponse(response, globalT.globalErrors);

    onClose();

    queryClient.invalidateQueries({ queryKey: ["prompts"] });
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit((values) => {
          toast.promise(onSubmit(values), {
            loading: globalT.components.addPromptForm.creating,
            success: globalT.components.addPromptForm.success,
            error: globalT.components.addPromptForm.errorSaving,
          });
        })}
      >
        <div className="grid gap-4 py-2">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{globalT.components.addPromptForm.name}</FormLabel>
                <FormControl>
                  <Input
                    placeholder={globalT.components.addPromptForm.promptName}
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
                <FormLabel>
                  {globalT.components.addPromptForm.content}
                </FormLabel>
                <FormControl>
                  <Textarea
                    placeholder={
                      globalT.components.addPromptForm.contentPlaceholder
                    }
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
            {globalT.components.addPromptForm.cancel}
          </Button>
          <Button type="submit" disabled={form.formState.isSubmitting}>
            {globalT.components.addPromptForm.create}
            {form.formState.isSubmitting && (
              <Loader2 className="ml-2 h-4 w-4 animate-spin" />
            )}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
});
