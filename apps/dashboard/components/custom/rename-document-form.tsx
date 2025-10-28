import * as z from "zod";

import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { CustomDocument } from "@workspace/server/drizzle/schema";
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
import { useSharedTranslations } from "@workspace/ui/contexts/shared-translations-context";
import { type EditorContent } from "@workspace/ui/editors/text-editor";
import { apiFetcher } from "@workspace/ui/lib/fetcher";
import { filenameSchema } from "@workspace/ui/lib/validations";
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
    const { sharedT } = useSharedTranslations();

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

      const documentId = editorContent.id;

      if (!documentId) {
        throw new Error("Document Id is missing");
      }

      await apiFetcher(
        (client) =>
          client["documents"]["title"][":documentId"][":title"].$patch({
            param: { documentId, title: values.title },
          }),
        sharedT.apiCodes,
      );
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
                    pages: Array<CustomDocument[]>;
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
