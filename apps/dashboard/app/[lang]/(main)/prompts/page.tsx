"use client";

import { AddPromptForm } from "@/components/custom/add-prompt-form";
import { promptsColumns } from "@/components/tables/prompts-columns";
import { rpcFetcher } from "@/lib/fetcher";
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
import { useState } from "react";

export default function PromptsPage() {
  const [addPromptDialogOpen, setAddPromptDialogOpen] = useState(false);

  const {
    data: prompts,
    isLoading: promptsLoading,
    error: promptsError,
  } = useQuery({
    queryKey: ["prompts"],
    queryFn: () => rpcFetcher<"get_user_prompts">("get_user_prompts"),
  });

  if (promptsLoading) {
    return (
      <div className="p-2 flex flex-col space-y-8 justify-center items-center h-3/5">
        <h1 className="text-2xl font-semibold">Loading prompts...</h1>
        <Skeleton className="h-96 mx-auto w-full max-w-4xl" />
      </div>
    );
  }

  if (promptsError || !prompts) {
    return (
      <div className="p-2 flex flex-col space-y-8 justify-center items-center h-3/5">
        <h1 className="text-center text-2xl font-semibold">
          Prompts could not be loaded. Please try again later.
        </h1>
      </div>
    );
  }

  return (
    <>
      <Button
        className="absolute top-4 right-4"
        onClick={() => setAddPromptDialogOpen(true)}
      >
        Add prompt
      </Button>
      <Dialog open={addPromptDialogOpen} onOpenChange={setAddPromptDialogOpen}>
        <DialogTrigger asChild>
          <Button asChild className="absolute top-4 right-4">
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

      <div className="p-2 flex flex-col space-y-6 items-center">
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
