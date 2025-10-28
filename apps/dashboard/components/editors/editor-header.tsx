import { Button } from "@workspace/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@workspace/ui/components/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu";
import { useEditor } from "@workspace/ui/contexts/editor-context";
import { useRefs } from "@workspace/ui/contexts/refs-context";
import { useSharedTranslations } from "@workspace/ui/contexts/shared-translations-context";
import { SaveDocumentForm } from "@workspace/ui/custom-components/save-document-form";
import { textEditorSchema } from "@workspace/ui/editors/prosemirror-math/config";
import {
  mathLatexSerializer,
  mathMarkdownSerializer,
} from "@workspace/ui/editors/prosemirror-math/utils/text-serializer";
import { type EditorContent } from "@workspace/ui/editors/text-editor";
import { apiFetcher } from "@workspace/ui/lib/fetcher";
import { checkResponse } from "@workspace/ui/lib/translation-utils";
import { Check, Copy, Download, X } from "lucide-react";
import { DOMSerializer } from "prosemirror-model";
import { memo, useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { useCopyToClipboard, useLocalStorage } from "usehooks-ts";
import { KeyboardShortcut } from "../custom/keyboard-shortcut";
import { EditorDropdownMenu } from "./editor-dropdown-menu";
import { ModeSwitcher } from "./mode-switcher";

export const EditorHeader = memo(() => {
  const { sharedT } = useSharedTranslations();

  const { panelRef, textEditorRef, codeEditorRef } = useRefs();
  const [editorMode] = useEditor();

  const [_, copyToClipboard] = useCopyToClipboard();
  const [copied, setCopied] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);

  const [localTextEditorContent, setLocalTextEditorContent] =
    useLocalStorage<EditorContent>("text-editor-input", {
      id: undefined,
      title: "",
      content: "",
    });
  const [localCodeEditorContent, setLocalCodeEditorContent] =
    useLocalStorage<EditorContent>("text-editor-input", {
      id: undefined,
      title: "",
      content: "",
    });

  const editorContent =
    editorMode === "text" ? localTextEditorContent : localCodeEditorContent;
  const setEditorContent =
    editorMode === "text"
      ? setLocalTextEditorContent
      : setLocalCodeEditorContent;

  const saveDocument = useCallback(
    async (savedId?: string) => {
      if (isSaving || !savedId) return;

      const content =
        editorMode === "text"
          ? textEditorRef.current?.state.doc
            ? mathMarkdownSerializer.serialize(textEditorRef.current.state.doc)
            : ""
          : codeEditorRef.current?.state.doc.toString();

      if (!content) {
        toast.error("No content to save");
        return;
      }

      setIsSaving(true);

      try {
        await apiFetcher(
          (client) =>
            client.documents.content[":documentId"].$patch({
              param: { documentId: savedId },
              json: { content },
            }),
          sharedT.apiCodes,
        );
      } catch (error) {
        toast.error("Failed to save document");
      } finally {
        setTimeout(() => setIsSaving(false), 600);
      }
    },
    [isSaving, editorMode, textEditorRef, codeEditorRef],
  );

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "s" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        if (editorContent.id) {
          saveDocument(editorContent.id);
        } else {
          setSaveDialogOpen(true);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [editorContent, saveDocument]);

  const handleCopy = useCallback(
    (format?: "markdown" | "latex") => {
      if (editorMode === "text" && textEditorRef.current) {
        const serializedContent =
          format === "latex"
            ? mathLatexSerializer.serialize(textEditorRef.current.state.doc)
            : mathMarkdownSerializer.serialize(textEditorRef.current.state.doc);
        copyToClipboard(serializedContent);
        setCopied(true);
      } else if (editorMode === "code" && codeEditorRef.current) {
        copyToClipboard(codeEditorRef.current.state.doc.toString());
        setCopied(true);
      }

      setTimeout(() => setCopied(false), 3500);
    },
    [editorMode, textEditorRef, codeEditorRef, copyToClipboard],
  );

  const handlePdfDownload = useCallback(async () => {
    if (editorMode === "text" && textEditorRef.current) {
      const title = editorContent.title || "Untitled document";
      const filename = `${title.replace(/\s+/g, "_").toLowerCase()}.pdf`;

      const contentElement = document.createElement("div");
      const fragment = DOMSerializer.fromSchema(
        textEditorSchema,
      ).serializeFragment(textEditorRef.current.state.doc.content);
      contentElement.appendChild(fragment);

      const toastId = toast.loading("Generating PDF...");

      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_PDF_EXPORTER_URL}/pdf-exporter/protected/export-pdf`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            credentials: "include",
            body: JSON.stringify({
              title,
              content: contentElement.innerHTML,
            }),
          },
        );

        checkResponse(response, sharedT.apiCodes);

        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);

        toast.success(`Downloaded as ${filename}`, { id: toastId });
      } catch (error) {
        toast.error("Failed to generate PDF", { id: toastId });
      }
    }
  }, [editorMode, textEditorRef, editorContent.title]);

  return (
    <div className="bg-sidebar flex h-14 items-center gap-2 border-b px-3">
      <Button variant="ghost" onClick={() => panelRef.current?.collapse()}>
        <X />
      </Button>

      <>
        {editorMode === "code" ? (
          <Button variant="ghost">
            {copied ? (
              <Check className="text-green-500" />
            ) : (
              <Copy onClick={() => handleCopy()} />
            )}
          </Button>
        ) : (
          <>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost">
                  {copied ? <Check className="text-green-500" /> : <Copy />}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem
                  className="cursor-pointer"
                  onClick={() => handleCopy("markdown")}
                >
                  Markdown
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="cursor-pointer"
                  onClick={() => handleCopy("latex")}
                >
                  Latex
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Button variant="ghost" onClick={handlePdfDownload}>
              <Download className="h-4 w-4" />
            </Button>
          </>
        )}

        <ModeSwitcher />

        {editorContent.id ? (
          <Button
            className="px-2"
            disabled={isSaving}
            onClick={() => saveDocument(editorContent.id)}
            variant="outline"
          >
            {isSaving ? "Saving..." : "Save"}
            <KeyboardShortcut keys={["⌘", "s"]} />
          </Button>
        ) : (
          <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
            <DialogTrigger asChild>
              <Button className="px-2" variant="outline">
                Save
                <KeyboardShortcut keys={["⌘", "s"]} />
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Set title</DialogTitle>
                <DialogDescription>
                  Saving this file will overwrite files with the same title.
                  After saving, the document will be accessible under
                  'Documents'
                </DialogDescription>
              </DialogHeader>
              <SaveDocumentForm
                onClose={() => setSaveDialogOpen(false)}
                editorContent={editorContent}
                setEditorContent={setEditorContent}
              />
            </DialogContent>
          </Dialog>
        )}

        <EditorDropdownMenu
          editorContent={editorContent}
          setEditorContent={setEditorContent}
          panelRef={panelRef}
        />
      </>
    </div>
  );
});
