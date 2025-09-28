import * as z from "zod";

import { useEditor } from "@/contexts/editor-context";
import { useGlobalTranslations } from "@/contexts/global-translations";
import { useRefs } from "@/contexts/refs-context";
import { type EditorContent } from "@/contexts/text-editor-content-context";
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
import { mathMarkdownSerializer } from "@workspace/ui/editors/prosemirror-math/utils/text-serializer";
import { checkResponse } from "@workspace/ui/lib/translation-utils";
import { filenameSchema } from "@workspace/ui/types/validations";
import { memo, useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

const titleFormSchema = z.object({
  title: filenameSchema,
});

type TitleFormData = z.infer<typeof titleFormSchema>;

interface SaveDocumentFormProps {
  onClose: () => void;
  editorContent: EditorContent;
  setEditorContent: (content: EditorContent) => void;
}

export const SaveDocumentForm = memo(
  ({ onClose, editorContent, setEditorContent }: SaveDocumentFormProps) => {
    const { globalT } = useGlobalTranslations();
    const queryClient = useQueryClient();

    const { textEditorRef, codeEditorRef } = useRefs();

    const [editorMode] = useEditor();

    const form = useForm<TitleFormData>({
      resolver: zodResolver(titleFormSchema),
      defaultValues: {
        title: editorContent.title,
      },
    });

    const onSubmit = async (values: TitleFormData) => {
      let content = "";
      let kind: "text" | "code" = "text";

      if (editorMode === "text" && textEditorRef.current) {
        content = mathMarkdownSerializer.serialize(
          textEditorRef.current.state.doc,
        );
        kind = "text";
      } else if (editorMode === "code" && codeEditorRef.current) {
        content = codeEditorRef.current.state.doc.toString();
        kind = "code";
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/capi/protected/documents`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            title: values.title,
            content,
            kind,
          }),
        },
      );

      checkResponse(response, globalT.globalErrors);
    };

    useEffect(() => {
      form.setValue("title", editorContent.title);
    }, []);

    return (
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit((values) => {
            toast.promise(onSubmit(values), {
              loading: "Saving...",
              success: () => {
                setEditorContent({
                  id: editorContent.id,
                  title: values.title,
                  content: editorContent.content,
                });
                onClose();

                queryClient.invalidateQueries({ queryKey: ["documents"] });

                return "Document saved!";
              },
              error: () => "Failed to save document. Please try again later.",
            });
          })}
        >
          <div className="grid gap-4 py-2">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
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
            <Button type="submit">Save</Button>
          </DialogFooter>
        </form>
      </Form>
    );
  },
);
