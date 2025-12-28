import { useWebTranslations } from "@/contexts/web-translations";
import { useQueryClient } from "@tanstack/react-query";
import { type CustomDocument } from "@workspace/server/drizzle/schema";
import { Button } from "@workspace/ui/components/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu";
import { Switch } from "@workspace/ui/components/switch";
import { useAutocomplete } from "@workspace/ui/contexts/autocomplete-context";
import { useEditor } from "@workspace/ui/contexts/editor-context";
import { useSharedTranslations } from "@workspace/ui/contexts/shared-translations-context";
import { DeleteForm } from "@workspace/ui/editors/delete-form";
import {
  RenameForm,
  type RenameFormData,
} from "@workspace/ui/editors/rename-form";
import { apiFetcher, removeFromInfiniteCache } from "@workspace/ui/lib/fetcher";
import { FilePlus, MoreVertical, Pencil, Trash2 } from "lucide-react";
import { useState } from "react";

interface EditorDropdownMenuProps {
  editorContent: {
    id?: string;
    title: string;
    content: string;
  };
  setEditorContent: (content: {
    title: string;
    content: string;
    id?: string;
  }) => void;
  clearEditor: () => void;
}

export const EditorDropdownMenu = ({
  editorContent,
  setEditorContent,
  clearEditor,
}: EditorDropdownMenuProps) => {
  const { sharedT } = useSharedTranslations();
  const { webT } = useWebTranslations();
  const queryClient = useQueryClient();

  const [editorMode] = useEditor();
  const [autocomplete, setAutocomplete] = useAutocomplete();

  const [renameDialogOpen, setRenameDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const onSubmit = async (values: RenameFormData) => {
    if (values.title === editorContent.title) {
      setRenameDialogOpen(false);
      return;
    }

    if (!editorContent.id) {
      throw new Error("Document Id is missing");
    }

    await apiFetcher(
      (client) =>
        client["documents"]["title"][":documentId"][":title"].$patch({
          param: {
            documentId: editorContent.id!,
            title: values.title,
          },
        }),
      sharedT.apiCodes,
    );
  };

  const handleRename = (values: RenameFormData) => {
    setEditorContent({
      ...editorContent,
      title: values.title,
    });
    setRenameDialogOpen(false);

    queryClient.setQueryData(
      ["documents"],
      (oldData: { pages: Array<CustomDocument[]>; pageParams: number[] }) => {
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
  };

  const handleDelete = async (deletedId?: string) => {
    if (editorMode === "pdf" || !deletedId) {
      return;
    }

    await apiFetcher(
      (client) =>
        client["documents"][":documentId"].$delete({
          param: { documentId: deletedId },
        }),
      sharedT.apiCodes,
    );

    setEditorContent({
      id: undefined,
      title: "",
      content: "",
    });
    clearEditor();

    setDeleteDialogOpen(false);

    removeFromInfiniteCache(queryClient, ["documents"], deletedId);
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline">
            <MoreVertical />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {editorContent.id && (
            <>
              <DropdownMenuItem
                className="cursor-pointer text-red-500 focus:text-red-400"
                onClick={() => setDeleteDialogOpen(true)}
              >
                <Trash2 className="mr-2 size-4" />
                <span>{webT.editorDropdownMenu.delete}</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                className="cursor-pointer"
                onClick={() => setRenameDialogOpen(true)}
              >
                <Pencil className="mr-2 size-4" />
                <span>{webT.editorDropdownMenu.rename}</span>
              </DropdownMenuItem>
            </>
          )}
          <DropdownMenuItem
            className="cursor-pointer"
            onClick={() => {
              setEditorContent({
                id: undefined,
                title: "",
                content: "",
              });
              clearEditor();
            }}
          >
            <FilePlus className="mr-2 size-4" />
            <span>{webT.editorDropdownMenu.new}</span>
          </DropdownMenuItem>
          {editorMode === "text" && (
            <DropdownMenuItem className="flex cursor-pointer justify-between">
              <span>{webT.editorDropdownMenu.autocomplete}</span>
              <Switch
                className="cursor-pointer"
                checked={
                  editorMode === "text" ? autocomplete.text : autocomplete.code
                }
                onCheckedChange={(checked) => {
                  setAutocomplete((prev) => ({
                    ...prev,
                    [editorMode]: checked,
                  }));
                }}
              />
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <RenameForm
        renameDialogOpen={renameDialogOpen}
        setRenameDialogOpen={setRenameDialogOpen}
        onSubmit={onSubmit}
        handleSuccess={handleRename}
        defaultTitle={editorContent.title}
        type="document"
      />

      <DeleteForm
        deleteDialogOpen={deleteDialogOpen}
        setDeleteDialogOpen={setDeleteDialogOpen}
        onDelete={() => handleDelete(editorContent.id)}
        type="document"
      />
    </>
  );
};
