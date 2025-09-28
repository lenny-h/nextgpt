import * as z from "zod";

import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@workspace/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@workspace/ui/components/form";
import { Input } from "@workspace/ui/components/input";
import { capitalizeFirstLetter } from "@workspace/ui/lib/utils";
import { filenameSchema } from "@workspace/ui/types/validations";
import { memo, useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

const renameFormSchema = z.object({
  title: filenameSchema,
});

export type RenameFormData = z.infer<typeof renameFormSchema>;

interface RenameDocumentFormProps {
  renameDialogOpen: boolean;
  setRenameDialogOpen: (open: boolean) => void;
  onSubmit: (values: RenameFormData) => Promise<void>;
  handleSuccess: (values: RenameFormData) => string;
  defaultTitle: string;
  type: "document" | "chat";
}

export const RenameForm = memo(
  ({
    renameDialogOpen,
    setRenameDialogOpen,
    onSubmit,
    handleSuccess,
    defaultTitle,
    type,
  }: RenameDocumentFormProps) => {
    const form = useForm<RenameFormData>({
      resolver: zodResolver(renameFormSchema),
      defaultValues: {
        title: defaultTitle,
      },
    });

    useEffect(() => {
      form.setValue("title", defaultTitle);
    }, [form, defaultTitle]);

    return (
      <Dialog open={renameDialogOpen} onOpenChange={setRenameDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Rename {type}</DialogTitle>
            <DialogDescription>
              Enter a new title for your {type}
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form
              onSubmit={form.handleSubmit((values) => {
                toast.promise(onSubmit(values), {
                  loading: "Renaming...",
                  success: () => handleSuccess(values),
                  error: (error) => {
                    console.error(error);
                    return `Failed to rename ${type}. Please try again later.`;
                  },
                });
              })}
            >
              <div className="grid gap-4 py-2">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>New Title</FormLabel>
                      <FormControl>
                        <Input
                          placeholder={`${capitalizeFirstLetter(type)} title`}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <DialogFooter className="mt-4">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setRenameDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit">Rename</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    );
  },
);
