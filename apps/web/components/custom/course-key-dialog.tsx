"use client";

import * as z from "zod";

import { useGlobalTranslations } from "@/contexts/global-translations";
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
import { checkResponse } from "@workspace/ui/lib/translation-utils";
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
    const { globalT } = useGlobalTranslations();

    const form = useForm<CourseKeyData>({
      resolver: zodResolver(courseKeySchema),
      defaultValues: {
        key: "",
      },
    });

    const onSubmit = async (values: CourseKeyData) => {
      toast.promise(
        fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/capi/protected/courses/request-access`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            credentials: "include",
            body: JSON.stringify({
              courseId,
              key: values.key,
            }),
          },
        ).then(async (response) => {
          checkResponse(response, globalT.globalErrors, {
            403: "Invalid course key",
          });
        }),
        {
          loading: "Requesting course access...",
          success: () => {
            form.reset();
            onSuccess();
            return "Course access granted!";
          },
          error: (error) => {
            console.error(error);
            return error.message || "Failed to request course access";
          },
        },
      );
    };

    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Course Access Required</DialogTitle>
            <DialogDescription>
              Please enter the access key for "{courseName}" to continue.
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
                      <FormLabel>Course Key</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter course access key"
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
                  Cancel
                </Button>
                <Button type="submit">Submit</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    );
  },
);
