"use client";

import { useDashboardTranslations } from "@/contexts/dashboard-translations";
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
import { useSharedTranslations } from "@workspace/ui/contexts/shared-translations-context";
import { type ErrorDictionary } from "@workspace/ui/lib/translation-utils";
import { useState } from "react";
import { toast } from "sonner";

interface Props {
  open: boolean;
  setOpen: (open: boolean) => void;
  deleteResource: (
    queryClient: QueryClient,
    errorDictionary: ErrorDictionary,
  ) => Promise<{ name: string }>;
  resourceType: "bucket" | "course";
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
  const { sharedT } = useSharedTranslations();
  const { dashboardT } = useDashboardTranslations();
  const queryClient = useQueryClient();

  const [input, setInput] = useState("");

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-106.25">
        <DialogHeader>
          <DialogTitle>
            {dashboardT.deleteDialogWithConfirmation.title[resourceType]}
          </DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <div className="w-full space-y-2">
          <p className="text-muted-foreground text-sm">
            {dashboardT.deleteDialogWithConfirmation.typeToConfirm.replace(
              "{resourceName}",
              resourceName,
            )}
          </p>
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={
              dashboardT.deleteDialogWithConfirmation.placeholder[resourceType]
            }
          />
        </div>
        <DialogFooter className="mt-4">
          <Button
            type="button"
            variant="secondary"
            onClick={() => setOpen(false)}
          >
            {dashboardT.deleteDialogWithConfirmation.cancel}
          </Button>
          <Button
            type="submit"
            variant="destructive"
            disabled={input !== resourceName}
            onClick={() => {
              toast.promise(deleteResource(queryClient, sharedT.apiCodes), {
                loading: dashboardT.deleteDialogWithConfirmation.deleting,
                success: (result) =>
                  dashboardT.deleteDialogWithConfirmation.success[
                    resourceType
                  ].replace("{name}", result.name),
                error: (error) =>
                  dashboardT.deleteDialogWithConfirmation.error[
                    resourceType
                  ].replace("{message}", error.message),
              });
            }}
          >
            {dashboardT.deleteDialogWithConfirmation.delete}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
