"use client";

import { promptsColumns } from "@/components/tables/prompts-columns";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@workspace/ui/components/button";
import { DataTable } from "@workspace/ui/components/data-table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@workspace/ui/components/dialog";
import { Skeleton } from "@workspace/ui/components/skeleton";
import { useSharedTranslations } from "@workspace/ui/contexts/shared-translations-context";
import { AddPromptForm } from "@workspace/ui/custom-components/add-prompt-form";
import { apiFetcher } from "@workspace/ui/lib/fetcher";
import { useState } from "react";

export default function PromptsPage() {
  const { sharedT } = useSharedTranslations();

  const [addPromptDialogOpen, setAddPromptDialogOpen] = useState(false);

  const {
    data: prompts,
    isLoading: promptsLoading,
    error: promptsError,
  } = useQuery({
    queryKey: ["prompts"],
    queryFn: () =>
      apiFetcher((client) => client["prompts"].$get(), sharedT.apiCodes),
  });

  if (promptsLoading) {
    return (
      <div className="flex h-3/5 flex-col items-center justify-center space-y-8 p-2">
        <h1 className="text-2xl font-semibold">Loading prompts...</h1>
        <Skeleton className="mx-auto h-96 w-full max-w-4xl" />
      </div>
    );
  }

  if (promptsError || !prompts) {
    return (
      <div className="flex h-3/5 flex-col items-center justify-center space-y-8 p-2">
        <h1 className="text-muted-foreground text-center text-xl font-medium">
          Prompts could not be loaded. Please try again later.
        </h1>
      </div>
    );
  }

  return (
    <>
      <Button
        className="absolute right-4 top-4"
        onClick={() => setAddPromptDialogOpen(true)}
      >
        Add prompt
      </Button>
      <Dialog open={addPromptDialogOpen} onOpenChange={setAddPromptDialogOpen}>
        <DialogTrigger asChild>
          <Button asChild className="absolute right-4 top-4">
            Add prompt
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Prompt</DialogTitle>
            <DialogDescription>
              Specify how the AI should correct the hand-ins.
            </DialogDescription>
          </DialogHeader>
          <AddPromptForm onClose={() => setAddPromptDialogOpen(false)} />
        </DialogContent>
      </Dialog>

      <div className="flex flex-col items-center space-y-6 p-4">
        <div className="flex items-center space-x-2">
          <h1 className="text-2xl font-semibold">Prompts</h1>
        </div>
        <DataTable
          columns={promptsColumns}
          data={prompts}
          visibilityState={{
            id: false,
            name: true,
            content: true,
            delete: true,
          }}
          filterLabel="prompt name"
          filterColumn="name"
        />
      </div>
    </>
  );
}
