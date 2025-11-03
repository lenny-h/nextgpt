"use client";

import * as z from "zod";

import { useFilter } from "@/contexts/filter-context";
import { studyModes, studyModeSchema } from "@/lib/study-modes";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@workspace/ui/components/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@workspace/ui/components/collapsible";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@workspace/ui/components/form";
import { SubmitButton } from "@workspace/ui/custom-components/submit-button";
import { ChevronDown, File } from "lucide-react";
import { memo, useState } from "react";
import { useForm } from "react-hook-form";
import { FileSelector } from "./file-selector";
import { PageRangeForm } from "./page-range-form";

const practiceFormSchema = z.object({
  studyMode: studyModeSchema,
});

type PracticeFormData = z.infer<typeof practiceFormSchema>;

interface PracticeFormProps {
  submitForm: () => void;
}

export const PracticeForm = memo(({ submitForm }: PracticeFormProps) => {
  const { filter, setFilter, studyMode, setStudyMode } = useFilter();

  const [expandedFiles, setExpandedFiles] = useState<string[]>([]);

  const practiceForm = useForm<PracticeFormData>({
    resolver: zodResolver(practiceFormSchema),
    defaultValues: {
      studyMode: studyMode,
    },
  });

  // // Sync form with context when studyMode changes externally
  // useEffect(() => {
  //   practiceForm.setValue("studyMode", studyMode);
  // }, [studyMode, practiceForm]);

  const handleUpdatePageRange = (fileId: string, pageRange: string) => {
    setFilter((prev) => {
      const updatedFiles = prev.files.map((file) => {
        if (file.id === fileId) {
          return { ...file, pageRange };
        }
        return file;
      });
      return { ...prev, files: updatedFiles };
    });
  };

  const handleClearPageRange = (fileId: string) => {
    setFilter((prev) => {
      const updatedFiles = prev.files.map((file) => {
        if (file.id === fileId) {
          const { pageRange, ...rest } = file;
          return rest;
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
            practice specific page ranges of PDF files by adding them below.
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
                      {file.name.endsWith(".pdf") ? (
                        <PageRangeForm
                          fileId={file.id}
                          currentPageRange={file.pageRange}
                          onUpdate={handleUpdatePageRange}
                          onClear={handleClearPageRange}
                        />
                      ) : (
                        <p className="text-muted-foreground italic">
                          Page range selection is only available for PDF files.
                        </p>
                      )}
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              );
            })}
          </div>
        </div>

        <Form {...practiceForm}>
          <form
            onSubmit={practiceForm.handleSubmit(() => submitForm())}
            className="w-full"
          >
            <div className="w-full rounded-md border p-4">
              <FormField
                control={practiceForm.control}
                name="studyMode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-lg font-medium">
                      Study Mode
                    </FormLabel>
                    <FormControl>
                      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                        {studyModes.map((mode) => (
                          <Button
                            key={mode.id}
                            type="button"
                            variant="outline"
                            onClick={() => {
                              field.onChange(mode.id);
                              setStudyMode(mode.id);
                            }}
                            className={`h-auto justify-start px-3 py-2 text-left font-normal ${
                              field.value === mode.id
                                ? "bg-muted border-primary shadow-sm"
                                : ""
                            }`}
                          >
                            <span className="truncate">{mode.label}</span>
                          </Button>
                        ))}
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="mt-6 flex w-full justify-center">
              <SubmitButton
                isPending={practiceForm.formState.isSubmitting}
                pendingText="Starting..."
              >
                Start
              </SubmitButton>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
});
