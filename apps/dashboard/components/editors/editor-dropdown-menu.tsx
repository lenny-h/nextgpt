import { useAutocomplete } from "@/contexts/autocomplete-context";
import { useEditor } from "@/contexts/editor-context";
import { removeFromInfiniteCache } from "@/lib/fetcher";
import { createClient } from "@/lib/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@workspace/ui/components/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu";
import { Switch } from "@workspace/ui/components/switch";
import { DeleteForm } from "@workspace/ui/editors/delete-form";
import {
  RenameForm,
  type RenameFormData,
} from "@workspace/ui/editors/rename-form";
import { type Tables } from "@workspace/ui/types/database";
import { FilePlus, MoreVertical, Pencil, Trash2 } from "lucide-react";
import { type RefObject, useState } from "react";
import { type ImperativePanelHandle } from "react-resizable-panels";

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
  panelRef: RefObject<ImperativePanelHandle | null>;
}

export const EditorDropdownMenu = ({
  editorContent,
  setEditorContent,
  panelRef,
}: EditorDropdownMenuProps) => {
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

    const supabase = createClient();

    const { error } = await supabase.rpc("update_document_title", {
      p_id: editorContent.id,
      p_title: values.title,
    });

    if (error) {
      throw new Error("Failed to rename document");
    }
  };

  const handleSuccess = (values: RenameFormData) => {
    setEditorContent({
      ...editorContent,
      title: values.title,
    });
    setRenameDialogOpen(false);

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
                : doc
            )
          ),
          pageParams: oldData.pageParams,
        };
      }
    );

    return "Document renamed!";
  };

  const handleDelete = async (deletedId?: string) => {
    if (!deletedId) {
      return;
    }

    const supabase = createClient();

    const { error } = await supabase.rpc("delete_document", {
      p_id: deletedId,
    });

    if (error) {
      throw new Error("Failed to delete document");
    }

    panelRef.current?.collapse();
    setEditorContent({
      title: "",
      content: "",
    });

    setDeleteDialogOpen(false);

    removeFromInfiniteCache(queryClient, ["documents"], deletedId);
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost">
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
                <Trash2 className="size-4 mr-2" />
                <span>Delete</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                className="cursor-pointer"
                onClick={() => setRenameDialogOpen(true)}
              >
                <Pencil className="size-4 mr-2" />
                <span>Rename</span>
              </DropdownMenuItem>
            </>
          )}
          <DropdownMenuItem
            className="cursor-pointer"
            onClick={() => {
              setEditorContent({
                title: "",
                content: "",
              });
            }}
          >
            <FilePlus className="size-4 mr-2" />
            <span>New</span>
          </DropdownMenuItem>
          {editorMode === "text" && (
            <DropdownMenuItem className="flex justify-between cursor-pointer">
              <span>Autocomplete</span>
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
        handleSuccess={handleSuccess}
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
