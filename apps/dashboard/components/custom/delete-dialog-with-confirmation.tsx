"use client";

import { useGlobalTranslations } from "@/contexts/global-translations";
import { QueryClient, useQueryClient } from "@tanstack/react-query";
import { Button } from "@workspace/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/dialog";
import { Input } from "@workspace/ui/components/input";
import { type ErrorDictionary } from "@workspace/ui/lib/translation-utils";
import { capitalizeFirstLetter } from "@workspace/ui/lib/utils";
import { useState } from "react";
import { toast } from "sonner";

interface Props {
  open: boolean;
  setOpen: (open: boolean) => void;
  deleteResource: (
    queryClient: QueryClient,
    errorDictionary: ErrorDictionary,
  ) => Promise<{ name: string }>;
  resourceType: string;
  resourceName: string;
  description: string;
}

export function DeleteDialogWithConfirmation({
  open,
  setOpen,
  deleteResource,
  resourceType,
  resourceName,
  description,
}: Props) {
  const { globalT } = useGlobalTranslations();
  const queryClient = useQueryClient();

  const [input, setInput] = useState("");

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Delete {resourceType}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <div className="w-full space-y-2">
          <p className="text-muted-foreground text-xs">
            Type '{resourceName}'' to confirm
          </p>
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={`Type in name of ${resourceType}`}
          />
        </div>
        <DialogFooter className="mt-4">
          <Button
            type="button"
            variant="secondary"
            onClick={() => setOpen(false)}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="destructive"
            disabled={input !== resourceName}
            onClick={() => {
              toast.promise(deleteResource(queryClient, globalT.globalErrors), {
                loading: "Deleting...",
                success: (result) =>
                  `${capitalizeFirstLetter(
                    resourceType,
                  )} ${result.name} deleted successfully 🎉`,
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
