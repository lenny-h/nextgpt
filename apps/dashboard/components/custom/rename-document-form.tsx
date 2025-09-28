import * as z from "zod";

import { type EditorContent } from "@/contexts/text-editor-content-context";
import { createClient } from "@/lib/supabase/client";
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
import { type Tables } from "@workspace/ui/types/database";
import { filenameSchema } from "@workspace/ui/types/validations";
import { memo, useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

const renameFormSchema = z.object({
  title: filenameSchema,
});

type RenameFormData = z.infer<typeof renameFormSchema>;

interface RenameDocumentFormProps {
  onClose: () => void;
  editorContent: EditorContent;
  setEditorContent: (content: EditorContent) => void;
}

export const RenameDocumentForm = memo(
  ({ onClose, editorContent, setEditorContent }: RenameDocumentFormProps) => {
    const queryClient = useQueryClient();

    const form = useForm<RenameFormData>({
      resolver: zodResolver(renameFormSchema),
      defaultValues: {
        title: editorContent.title,
      },
    });

    const onSubmit = async (values: RenameFormData) => {
      if (values.title === editorContent.title) {
        onClose();
        return;
      }

      if (!editorContent.id) {
        throw new Error("Document Id is missing");
      }

      const supabase = createClient();

      const { error } = await supabase.rpc("update_document_title", {
        p_id: editorContent.id,
        p_title: values.title,
      });

      if (error) {
        throw new Error("Failed to rename document");
      }
    };

    useEffect(() => {
      form.setValue("title", editorContent.title);
    }, [editorContent.title, form]);

    return (
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit((values) => {
            toast.promise(onSubmit(values), {
              loading: "Renaming...",
              success: () => {
                setEditorContent({
                  ...editorContent,
                  title: values.title,
                });
                onClose();

                queryClient.setQueryData(
                  ["documents"],
                  (oldData: {
                    pages: Array<Tables<"documents">[]>;
                    pageParams: number[];
                  }) => {
                    if (!oldData) return oldData;
                    return {
                      pages: oldData.pages.map((page) =>
                        page.map((doc) =>
                          doc.id === editorContent.id
                            ? { ...doc, title: values.title }
                            : doc,
                        ),
                      ),
                      pageParams: oldData.pageParams,
                    };
                  },
                );

                return "Document renamed!";
              },
              error: (error) => {
                console.error(error);
                return "Failed to rename document. Please try again later.";
              },
            });
          })}
        >
          <div className="grid gap-4 py-2">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>New Title</FormLabel>
                  <FormControl>
                    <Input placeholder="Document Title" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <DialogFooter className="mt-4">
            <Button type="button" variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">Rename</Button>
          </DialogFooter>
        </form>
      </Form>
    );
  },
);
