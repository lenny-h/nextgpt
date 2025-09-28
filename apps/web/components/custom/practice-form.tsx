"use client";

import { useFilter } from "@/contexts/filter-context";
import { studyModes } from "@/lib/study-modes";
import { Button } from "@workspace/ui/components/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@workspace/ui/components/collapsible";
import { Input } from "@workspace/ui/components/input";
import { ChevronDown, File, Trash2 } from "lucide-react";
import { memo, useState } from "react";
import { FileSelector } from "./file-selector";

interface PracticeFormProps {
  submitForm: () => void;
}

export const PracticeForm = memo(({ submitForm }: PracticeFormProps) => {
  const { filter, setFilter, studyMode, setStudyMode } = useFilter();

  const [expandedFiles, setExpandedFiles] = useState<string[]>([]);

  const handleUpdateChapter = (fileId: string, chapterNumber: number) => {
    setFilter((prev) => {
      const updatedFiles = prev.files.map((file) => {
        if (file.id === fileId) {
          if (!file.chapters) {
            return { ...file, chapters: new Set<number>([chapterNumber]) };
          }

          const updatedChapters = file.chapters.has(chapterNumber)
            ? new Set([...file.chapters].filter((num) => num !== chapterNumber))
            : new Set([...file.chapters, chapterNumber]);

          return { ...file, chapters: updatedChapters };
        }
        return file;
      });
      return { ...prev, files: updatedFiles };
    });
  };

  const toggleExpandFile = (fileId: string) => {
    setExpandedFiles((prev) =>
      prev.includes(fileId)
        ? prev.filter((id) => id !== fileId)
        : [...prev, fileId],
    );
  };

  return (
    <div className="flex-1 overflow-y-scroll px-6 pb-3 pt-8">
      <div className="mx-auto flex w-full max-w-2xl flex-col items-center space-y-8">
        <div className="flex flex-col space-y-4 text-center">
          <h1 className="text-2xl font-semibold">Let's practice! 🚀</h1>
          <p className="text-muted-foreground font-medium">
            Select the files whose content you want to practice. You can also
            practice specific chapters of a file by adding them below.
          </p>
        </div>

        <FileSelector />

        <div className="h-fit min-h-80 w-full rounded-md border">
          <div className="space-y-4 p-4">
            {filter.files.map((file) => {
              const isExpanded = expandedFiles.includes(file.id);

              return (
                <Collapsible
                  key={file.id}
                  open={isExpanded}
                  onOpenChange={() => toggleExpandFile(file.id)}
                  className="border-border/50 w-full overflow-hidden rounded-lg border"
                >
                  <CollapsibleTrigger className="bg-muted/50 flex w-full items-center justify-between p-3 text-sm font-medium">
                    <div className="flex items-center gap-2">
                      <File size={16} />
                      <span>{file.name}</span>
                    </div>
                    <ChevronDown
                      className={
                        isExpanded
                          ? "rotate-180 transform transition-transform"
                          : "transition-transform"
                      }
                      size={16}
                    />
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="space-y-3 p-3 text-sm">
                      <form
                        className="flex items-center gap-2"
                        onSubmit={(e) => {
                          e.preventDefault();
                          const formData = new FormData(e.currentTarget);
                          const chapter = Number(formData.get("chapter"));
                          if (chapter && !isNaN(chapter)) {
                            handleUpdateChapter(file.id, chapter);
                            e.currentTarget.reset();
                          }
                        }}
                      >
                        <Input
                          type="number"
                          name="chapter"
                          placeholder="Add a chapter"
                          className="max-w-[200px]"
                          min={1}
                          max={100}
                          required
                        />
                        <Button type="submit" variant="outline">
                          Add
                        </Button>
                      </form>
                      {file.chapters &&
                        Array.from(file.chapters).map((chapter) => (
                          <div
                            key={chapter}
                            className="bg-muted/30 hover:bg-muted/50 flex items-center justify-between gap-2 rounded-md border px-2 py-1 transition-colors"
                          >
                            <span className="font-medium">
                              Chapter {chapter}
                            </span>
                            <Button
                              variant="ghost"
                              onClick={() =>
                                handleUpdateChapter(file.id, chapter)
                              }
                            >
                              <Trash2 className="size-4" />
                            </Button>
                          </div>
                        ))}
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              );
            })}
          </div>
        </div>

        <div className="w-full rounded-md border p-4">
          <h2 className="mb-3 text-lg font-medium">Study Mode</h2>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {studyModes.map((mode) => (
              <Button
                key={mode.id}
                variant="outline"
                onClick={() => setStudyMode(mode.id)}
                className={`h-auto justify-start px-3 py-2 text-left font-normal ${
                  studyMode === mode.id
                    ? "bg-muted border-primary shadow-sm"
                    : ""
                }`}
              >
                <span className="truncate">{mode.label}</span>
              </Button>
            ))}
          </div>
        </div>
        <Button onClick={submitForm}>Start</Button>
      </div>
    </div>
  );
});
