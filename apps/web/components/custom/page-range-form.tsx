import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@workspace/ui/components/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@workspace/ui/components/form";
import { Input } from "@workspace/ui/components/input";
import { Trash2 } from "lucide-react";
import { memo } from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { useFilter } from "@/contexts/filter-context";

// NOTE: schema is created per-component instance below because it
// depends on the file's pageCount which is only available at runtime.

type PageRangeFormData = {
  pageRange?: string;
};

interface PageRangeFormProps {
  fileId: string;
  currentPageRange?: string;
  onUpdate: (fileId: string, pageRange: string) => void;
  onClear: (fileId: string) => void;
}

export const PageRangeForm = memo(
  ({ fileId, currentPageRange, onUpdate, onClear }: PageRangeFormProps) => {
    const { filter } = useFilter();
    const file = filter.files.find((f) => f.id === fileId);

    if (!file) {
      return null;
    }

    const pageCount = file.pageCount;

    const pageRangeSchema = z.object({
      pageRange: z
        .string()
        .optional()
        .refine(
          (val) => {
            if (!val) return true; // empty is allowed

            const s = val.trim();
            if (!s) return true;

            // Validate format tokens like '1', '3-5'
            const tokens = s.split(",").map((t) => t.trim());
            if (tokens.length === 0) return false;

            for (const token of tokens) {
              if (/^\d+$/.test(token)) {
                const n = Number(token);
                if (Number.isNaN(n) || n < 1) return false;
                if (pageCount && n > pageCount) return false;
              } else if (/^\d+-\d+$/.test(token)) {
                const [a, b] = token.split("-").map(Number);
                if (Number.isNaN(a) || Number.isNaN(b) || a < 1 || b < a)
                  return false;
                if (b > pageCount) return false;
              } else {
                return false;
              }
            }

            return true;
          },
          {
            message: `Enter page ranges like: 1,3-5,7 and ensure pages are between 1 and ${pageCount}`,
          },
        ),
    });

    const pageRangeForm = useForm<PageRangeFormData>({
      resolver: zodResolver(pageRangeSchema),
      defaultValues: {
        pageRange: "",
      },
    });

    const onSubmit = (values: PageRangeFormData) => {
      if (values.pageRange && values.pageRange.trim()) {
        onUpdate(fileId, values.pageRange.trim());
        pageRangeForm.reset();
      }
    };

    return (
      <>
        <Form {...pageRangeForm}>
          <form
            className="flex items-center gap-2"
            onSubmit={pageRangeForm.handleSubmit(onSubmit)}
          >
            <FormField
              control={pageRangeForm.control}
              name="pageRange"
              render={({ field }) => (
                <FormItem className="flex-1">
                  <FormControl>
                    <Input placeholder="e.g., 1,3-5,7" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" variant="outline">
              Set
            </Button>
          </form>
        </Form>
        {currentPageRange && (
          <div className="bg-muted/30 hover:bg-muted/50 flex items-center justify-between gap-2 rounded-md border px-2 py-1 transition-colors">
            <span className="font-medium">Pages: {currentPageRange}</span>
            <Button variant="ghost" onClick={() => onClear(fileId)}>
              <Trash2 className="size-4" />
            </Button>
          </div>
        )}
      </>
    );
  },
);
