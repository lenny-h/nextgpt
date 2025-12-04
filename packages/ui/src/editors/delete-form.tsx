import { Button } from "@workspace/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/dialog";
import { useSharedTranslations } from "@workspace/ui/contexts/shared-translations-context";
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
    const { sharedT } = useSharedTranslations();

    return (
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{sharedT.deleteForm.title[type]}</DialogTitle>
            <DialogDescription>
              {sharedT.deleteForm.description[type]}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setDeleteDialogOpen(false)}
            >
              {sharedT.deleteForm.cancel}
            </Button>
            <Button
              type="submit"
              onClick={() => {
                toast.promise(onDelete(), {
                  loading: sharedT.deleteForm.deleting,
                  success: () => sharedT.deleteForm.deleted[type],
                  error: () => sharedT.deleteForm.error[type],
                });
              }}
            >
              {sharedT.deleteForm.delete}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }
);
