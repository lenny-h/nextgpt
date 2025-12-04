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
import { useSharedTranslations } from "@workspace/ui/contexts/shared-translations-context";
import { memo, useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { filenameSchema } from "../lib/validations";

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
    const { sharedT } = useSharedTranslations();

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
            <DialogTitle>{sharedT.renameForm.title[type]}</DialogTitle>
            <DialogDescription>
              {sharedT.renameForm.description[type]}
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form
              onSubmit={form.handleSubmit((values) => {
                toast.promise(onSubmit(values), {
                  loading: sharedT.renameForm.renaming,
                  success: () => handleSuccess(values),
                  error: (error) => {
                    console.error(error);
                    return sharedT.renameForm.error[type];
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
                      <FormLabel>{sharedT.renameForm.newTitle}</FormLabel>
                      <FormControl>
                        <Input
                          placeholder={sharedT.renameForm.placeholder[type]}
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
                  {sharedT.renameForm.cancel}
                </Button>
                <Button type="submit">{sharedT.renameForm.rename}</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    );
  }
);
