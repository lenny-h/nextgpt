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
import { useRefs } from "@workspace/ui/contexts/refs-context";
import { useSharedTranslations } from "@workspace/ui/contexts/shared-translations-context";
import { mathMarkdownSerializer } from "@workspace/ui/editors/prosemirror-math/utils/text-serializer";
import { type EditorContent } from "@workspace/ui/editors/text-editor";
import { apiFetcher } from "@workspace/ui/lib/fetcher";
import { filenameSchema } from "@workspace/ui/lib/validations";
import { memo, useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { useEditor } from "../contexts/editor-context";

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
    const { sharedT } = useSharedTranslations();

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
      let content, payload;
      if (editorMode === "text" && textEditorRef.current) {
        content = mathMarkdownSerializer.serialize(
          textEditorRef.current.state.doc
        );
        payload = {
          title: values.title,
          content,
          kind: "text" as const,
        };
      } else if (editorMode === "code" && codeEditorRef.current) {
        content = codeEditorRef.current.state.doc.toString();
        payload = {
          title: values.title,
          content,
          kind: "code" as const,
        };
      } else {
        return;
      }

      const result = await apiFetcher(
        (client) => client.documents.$post({ json: payload }),
        sharedT.apiCodes
      );

      setEditorContent({
        id: result.id,
        title: values.title,
        content,
      });
      onClose();

      queryClient.invalidateQueries({ queryKey: ["documents"] });
    };

    useEffect(() => {
      form.setValue("title", editorContent.title);
    }, []);

    return (
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit((values) => {
            toast.promise(onSubmit(values), {
              loading: sharedT.saveDocumentForm.saving,
              success: sharedT.saveDocumentForm.saved,
              error: (error) => error.message || sharedT.saveDocumentForm.error,
            });
          })}
        >
          <div className="grid gap-4 py-2">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{sharedT.saveDocumentForm.titleLabel}</FormLabel>
                  <FormControl>
                    <Input
                      placeholder={sharedT.saveDocumentForm.titlePlaceholder}
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
              {sharedT.saveDocumentForm.cancel}
            </Button>
            <Button type="submit">{sharedT.saveDocumentForm.save}</Button>
          </DialogFooter>
        </form>
      </Form>
    );
  }
);
