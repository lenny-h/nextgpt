"use client";

import { useGlobalTranslations } from "@/contexts/global-translations";
import { type QueryClient, useQueryClient } from "@tanstack/react-query";
import { Button } from "@workspace/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/dialog";
import { type ErrorDictionary } from "@workspace/ui/lib/translation-utils";
import { capitalizeFirstLetter } from "@workspace/ui/lib/utils";
import { toast } from "sonner";

interface Props {
  open: boolean;
  setOpen: (open: boolean) => void;
  deleteResource: (
    queryClient: QueryClient,
    errorDictionary: ErrorDictionary,
  ) => Promise<{ name: string }>;
  resourceType: string;
  description: string;
}

export function DeleteDialog({
  open,
  setOpen,
  deleteResource,
  resourceType,
  description,
}: Props) {
  const { globalT } = useGlobalTranslations();
  const queryClient = useQueryClient();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {globalT.components.deleteDialog.delete + " " + resourceType}
          </DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <DialogFooter className="mt-4">
          <Button
            type="button"
            variant="secondary"
            onClick={() => setOpen(false)}
          >
            {globalT.components.deleteDialog.cancel}
          </Button>
          <Button
            type="submit"
            variant="destructive"
            onClick={() => {
              toast.promise(deleteResource(queryClient, globalT.globalErrors), {
                loading: globalT.components.deleteDialog.deleting,
                success: (result) =>
                  `${capitalizeFirstLetter(
                    resourceType,
                  )} ${result.name} ${globalT.components.deleteDialog.deletedSuccessfully} 🎉`,
                error: (error) =>
                  `Error deleting ${resourceType}: ${error.message}`,
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
