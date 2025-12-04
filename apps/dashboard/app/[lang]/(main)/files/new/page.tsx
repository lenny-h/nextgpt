"use client";

import { Dropzone } from "@/components/custom/dropzone";
import { useDashboardTranslations } from "@/contexts/dashboard-translations";
import { Button } from "@workspace/ui/components/button";
import { Checkbox } from "@workspace/ui/components/checkbox";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@workspace/ui/components/command";
import { DatePicker } from "@workspace/ui/components/date-picker";
import { Input } from "@workspace/ui/components/input";
import { Label } from "@workspace/ui/components/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@workspace/ui/components/popover";
import { useSharedTranslations } from "@workspace/ui/contexts/shared-translations-context";
import { useInfiniteQueryWithRPC } from "@workspace/ui/hooks/use-infinite-query";
import { apiFetcher } from "@workspace/ui/lib/fetcher";
import { cn } from "@workspace/ui/lib/utils";
import { Check, ChevronsUpDown, Loader2 } from "lucide-react";
import { useState } from "react";

export default function UploadFilesPage() {
  const { sharedT } = useSharedTranslations();
  const { dashboardT } = useDashboardTranslations();

  const [value, setValue] = useState("");
  const [coursesPopoverOpen, setCoursesPopoverOpen] = useState(false);
  const [processingDate, setProcessingDate] = useState<Date | undefined>(
    undefined,
  );

  // Page number offset state (where page "1" actually starts in the document)
  const [pageNumberOffset, setPageNumberOffset] = useState<number>(0);

  // PDF Pipeline Options state (only for PDFs)
  const [pdfPipelineOptions, setPdfPipelineOptions] = useState({
    do_ocr: false,
    do_code_enrichment: false,
    do_formula_enrichment: false,
    do_picture_description: false,
  });

  const {
    data: courses,
    isPending,
    error: coursesError,
    hasNextPage,
    isFetchingNextPage,
    inViewRef,
  } = useInfiniteQueryWithRPC({
    queryKey: ["courses"],
    queryFn: ({ pageParam }) =>
      apiFetcher(
        (client) =>
          client.courses.maintained.$get({
            query: {
              pageNumber: (pageParam ?? 0).toString(),
              itemsPerPage: "10",
            },
          }),
        sharedT.apiCodes,
      ),
  });

  if (isPending) {
    return (
      <div className="flex h-3/5 flex-col items-center justify-center space-y-8 p-2">
        <Loader2 className="animate-spin" />
      </div>
    );
  }

  if (coursesError || !courses) {
    return (
      <div className="flex h-3/5 flex-col items-center justify-center space-y-8 p-2">
        <h1 className="text-2xl font-semibold">
          {dashboardT.uploadFilesPage.errorLoading}
        </h1>
      </div>
    );
  }

  return (
    <div className="flex w-full flex-col items-center space-y-6 px-8 py-2">
      <h1 className="text-2xl font-semibold">
        {dashboardT.uploadFilesPage.title}
      </h1>
      <Popover open={coursesPopoverOpen} onOpenChange={setCoursesPopoverOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={coursesPopoverOpen}
            className="flex w-[200px]"
          >
            <p className="flex-1 truncate text-left">
              {value
                ? courses.find((c) => c.id === value)?.name
                : dashboardT.uploadFilesPage.selectCourse}
            </p>
            <ChevronsUpDown className="opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[200px] p-0">
          <Command>
            <CommandInput
              placeholder={dashboardT.uploadFilesPage.searchCourses}
              className="h-9"
            />
            <CommandList>
              <CommandEmpty>
                {dashboardT.uploadFilesPage.noCourseFound}
              </CommandEmpty>
              <CommandGroup>
                {courses.map((c) => (
                  <CommandItem
                    key={c.id}
                    value={c.id}
                    onSelect={(currentValue) => {
                      setValue(currentValue === value ? "" : currentValue);
                      setCoursesPopoverOpen(false);
                    }}
                  >
                    {c.name}
                    <Check
                      className={cn(
                        "ml-auto",
                        value === c.id ? "opacity-100" : "opacity-0",
                      )}
                    />
                  </CommandItem>
                ))}
                {hasNextPage && (
                  <div
                    ref={inViewRef}
                    className="flex h-8 items-center justify-center"
                  >
                    {isFetchingNextPage && (
                      <Loader2 className="size-4 animate-spin" />
                    )}
                  </div>
                )}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      <div className="flex flex-row items-center gap-4">
        <h2 className="text-muted-foreground">
          {dashboardT.uploadFilesPage.processingDate}
        </h2>
        <DatePicker
          date={processingDate}
          onSelect={setProcessingDate}
          placeholder={dashboardT.uploadFilesPage.selectProcessingDate}
          disabled={!value}
        />
      </div>

      <div className="w-full max-w-2xl space-y-4 rounded-md border border-dashed p-4 shadow-sm">
        <div className="space-y-2">
          <Label htmlFor="pageNumberOffset" className="text-lg font-semibold">
            {dashboardT.uploadFilesPage.pageNumberOffset}
          </Label>
          <p className="text-muted-foreground text-sm">
            {dashboardT.uploadFilesPage.pageNumberOffsetDescription}
          </p>
          <Input
            id="pageNumberOffset"
            type="number"
            min={0}
            max={1000}
            value={pageNumberOffset}
            onChange={(e) => {
              const val = parseInt(e.target.value, 10);
              if (!isNaN(val) && val >= 0 && val <= 1000) {
                setPageNumberOffset(val);
              }
            }}
            disabled={!value}
            className="w-32"
          />
        </div>
      </div>

      <div className="w-full max-w-2xl space-y-4 rounded-md border border-dashed p-4 shadow-sm">
        <h2 className="text-lg font-semibold">
          {dashboardT.uploadFilesPage.pdfProcessingOptions}
        </h2>
        <div className="grid gap-3">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="do_ocr"
              checked={pdfPipelineOptions.do_ocr}
              onCheckedChange={(checked) =>
                setPdfPipelineOptions((prev) => ({
                  ...prev,
                  do_ocr: checked === true,
                }))
              }
              disabled={!value}
            />
            <Label
              htmlFor="do_ocr"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              {dashboardT.uploadFilesPage.enableOcr}
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="do_code_enrichment"
              checked={pdfPipelineOptions.do_code_enrichment}
              onCheckedChange={(checked) =>
                setPdfPipelineOptions((prev) => ({
                  ...prev,
                  do_code_enrichment: checked === true,
                }))
              }
              disabled={!value}
            />
            <Label
              htmlFor="do_code_enrichment"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              {dashboardT.uploadFilesPage.enableCodeEnrichment}
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="do_formula_enrichment"
              checked={pdfPipelineOptions.do_formula_enrichment}
              onCheckedChange={(checked) =>
                setPdfPipelineOptions((prev) => ({
                  ...prev,
                  do_formula_enrichment: checked === true,
                }))
              }
              disabled={!value}
            />
            <Label
              htmlFor="do_formula_enrichment"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              {dashboardT.uploadFilesPage.enableFormulaEnrichment}
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="do_picture_description"
              checked={pdfPipelineOptions.do_picture_description}
              onCheckedChange={(checked) =>
                setPdfPipelineOptions((prev) => ({
                  ...prev,
                  do_picture_description: checked === true,
                }))
              }
              disabled={!value}
            />
            <Label
              htmlFor="do_picture_description"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              {dashboardT.uploadFilesPage.enablePictureDescription}
            </Label>
          </div>
        </div>
      </div>

      <Dropzone
        courseId={value}
        processingDate={processingDate}
        pageNumberOffset={pageNumberOffset}
        pdfPipelineOptions={pdfPipelineOptions}
      />
    </div>
  );
}
