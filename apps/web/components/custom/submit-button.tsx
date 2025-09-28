"use client";

import { Button } from "@workspace/ui/components/button";
import { type ComponentProps } from "react";

interface Props extends ComponentProps<typeof Button> {
  isPending: boolean;
  pendingText: string;
}

export const SubmitButton = ({
  children,
  isPending,
  pendingText,
  ...props
}: Props) => {
  return (
    <Button type="submit" disabled={isPending} {...props}>
      {isPending ? pendingText : children}
    </Button>
  );
};
