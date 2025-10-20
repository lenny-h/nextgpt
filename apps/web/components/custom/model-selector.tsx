"use client";

import { useFilter } from "@/contexts/filter-context";
import { useChatModel } from "@/contexts/selected-chat-model";
import {
  customChatModels,
  defaultChatModels,
  type ModelName,
} from "@/lib/models";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@workspace/ui/components/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu";
import { useSharedTranslations } from "@workspace/ui/contexts/shared-translations-context";
import { apiFetcher } from "@workspace/ui/lib/fetcher";
import { cn } from "@workspace/ui/lib/utils";
import { Check, ChevronDownIcon } from "lucide-react";
import { memo, useState } from "react";

export const ModelSelector = memo(() => {
  const { sharedT } = useSharedTranslations();

  const { filter } = useFilter();
  const { selectedChatModel, setSelectedChatModel } = useChatModel();

  const [open, setOpen] = useState(false);

  const { data: userModels } = useQuery({
    queryKey: ["userModels", filter.bucket.id],
    queryFn: () =>
      apiFetcher(
        (client) =>
          client["models"][":bucketId"].$get({
            param: { bucketId: filter.bucket.id },
          }),
        sharedT.apiCodes,
      ),
    enabled: !!filter.bucket.id,
  });

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="min-w-0 flex-shrink rounded-lg">
          <span className="truncate">{selectedChatModel.name}</span>
          <ChevronDownIcon
            className={cn(
              "ml-1 transition-transform duration-200 ease-in-out",
              open && "rotate-180",
            )}
          />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" side="top" className="min-w-[300px]">
        {defaultChatModels.map((chatModel) => {
          return (
            <DropdownMenuItem
              key={chatModel.id}
              onSelect={() => {
                setOpen(false);
                setSelectedChatModel(chatModel);
              }}
              className="flex flex-row items-center justify-between gap-4"
            >
              <div className="flex flex-col items-start gap-1">
                <div>{chatModel.name}</div>
                <div className="text-muted-foreground text-xs">
                  {chatModel.description}
                </div>
              </div>

              {chatModel.id === selectedChatModel.id && (
                <Check className="text-green-500" />
              )}
            </DropdownMenuItem>
          );
        })}
        {userModels && userModels.length > 0 && (
          <>
            <DropdownMenuSeparator />
            {userModels.map((model) => {
              return (
                <DropdownMenuItem
                  key={model.id}
                  onSelect={() => {
                    setOpen(false);
                    setSelectedChatModel({
                      ...model,
                      description: model.description || "Custom model",
                      images: customChatModels[model.name as ModelName].images,
                      pdfs: customChatModels[model.name as ModelName].pdfs,
                      reasoning:
                        customChatModels[model.name as ModelName].reasoning,
                    });
                  }}
                  className="flex flex-row items-center justify-between gap-4"
                >
                  <div className="flex flex-col items-start gap-1">
                    <div>{customChatModels[model.name as ModelName].name}</div>
                    <div className="text-muted-foreground text-xs">
                      {model.description || "Custom model"}
                    </div>
                  </div>

                  {model.id === selectedChatModel.id && (
                    <Check className="text-green-500" />
                  )}
                </DropdownMenuItem>
              );
            })}
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
});
