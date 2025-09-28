import { Button } from "@workspace/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/dialog";
import { capitalizeFirstLetter } from "@workspace/ui/lib/utils";
import { memo } from "react";
import { toast } from "sonner";

interface DeleteFormProps {
  deleteDialogOpen: boolean;
  setDeleteDialogOpen: (open: boolean) => void;
  onDelete: () => Promise<void>;
  type: "document" | "chat";
}

export const DeleteForm = memo(
  ({
    deleteDialogOpen,
    setDeleteDialogOpen,
    onDelete,
    type,
  }: DeleteFormProps) => {
    return (
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete document</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this document? This action cannot
              be undone. This will permanently delete the {type} and all
              associated data.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              onClick={() => {
                toast.promise(onDelete(), {
                  loading: "Deleting...",
                  success: () => `${capitalizeFirstLetter(type)} deleted!`,
                  error: () =>
                    `Failed to delete ${type}. Please try again later.`,
                });
              }}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }
);
