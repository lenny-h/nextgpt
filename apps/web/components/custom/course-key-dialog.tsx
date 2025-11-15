"use client";

import * as z from "zod";

import { useWebTranslations } from "@/contexts/web-translations";
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
import { apiFetcher } from "@workspace/ui/lib/fetcher";
import { memo } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

const courseKeySchema = z.object({
  key: z.string().min(1, "Course key is required"),
});

type CourseKeyData = z.infer<typeof courseKeySchema>;

interface CourseKeyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  courseId: string;
  courseName: string;
  onSuccess: () => void;
}

export const CourseKeyDialog = memo(
  ({
    open,
    onOpenChange,
    courseId,
    courseName,
    onSuccess,
  }: CourseKeyDialogProps) => {
    const { sharedT } = useSharedTranslations();
    const { webT } = useWebTranslations();

    const form = useForm<CourseKeyData>({
      resolver: zodResolver(courseKeySchema),
      defaultValues: {
        key: "",
      },
    });

    const onSubmit = async (values: CourseKeyData) => {
      const requestAccessPromise = apiFetcher(
        (client) =>
          client.courses["request-access"].$post({
            json: {
              courseId,
              key: values.key,
            },
          }),
        {
          ...sharedT.apiCodes,
          403: "Invalid course key",
        },
      ).then(() => {
        form.reset();
        onSuccess();
      });

      toast.promise(requestAccessPromise, {
        loading: webT.courseKeyDialog.requestingAccess,
        success: webT.courseKeyDialog.accessGranted,
        error: (error) =>
          error.message || webT.courseKeyDialog.failedToRequestAccess,
      });
    };

    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {webT.courseKeyDialog.courseAccessRequired}
            </DialogTitle>
            <DialogDescription>
              {webT.courseKeyDialog.enterAccessKey.replace(
                "{courseName}",
                courseName,
              )}
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <div className="grid gap-4 py-4">
                <FormField
                  control={form.control}
                  name="key"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{webT.courseKeyDialog.courseKey}</FormLabel>
                      <FormControl>
                        <Input
                          placeholder={
                            webT.courseKeyDialog.enterCourseAccessKey
                          }
                          type="password"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => onOpenChange(false)}
                >
                  {webT.courseKeyDialog.cancel}
                </Button>
                <Button type="submit">{webT.courseKeyDialog.submit}</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    );
  },
);
