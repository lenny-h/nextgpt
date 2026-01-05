"use client";

import { Button } from "@workspace/ui/components/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@workspace/ui/components/tooltip";
import { Camera } from "lucide-react";
import { memo, useCallback, useState } from "react";

interface ScreenshotButtonProps {
  isLoading: boolean;
  onScreenshotCapture: (file: File) => void;
}

const PureScreenshotButton = ({
  isLoading,
  onScreenshotCapture,
}: ScreenshotButtonProps) => {
  const [isCapturing, setIsCapturing] = useState(false);

  const captureScreenshot = useCallback(async () => {
    if (isCapturing) return;

    try {
      setIsCapturing(true);

      // Request screen capture
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          displaySurface: "monitor",
        },
        audio: false,
      });

      // Create a video element to capture a frame
      const video = document.createElement("video");
      video.srcObject = stream;
      await video.play();

      // Wait for the video to load properly
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Create a canvas and draw the video frame
      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        throw new Error("Failed to get canvas context");
      }

      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Stop all tracks to close the screen sharing prompt
      stream.getTracks().forEach((track) => track.stop());

      // Convert canvas to blob
      const blob = await new Promise<Blob | null>((resolve) => {
        canvas.toBlob(resolve, "image/png", 1.0);
      });

      if (!blob) {
        throw new Error("Failed to create screenshot blob");
      }

      // Create a File from the blob
      const timestamp = Date.now();
      const file = new File([blob], `screenshot-${timestamp}.png`, {
        type: "image/png",
      });

      onScreenshotCapture(file);
    } catch (error) {
      // User cancelled screen selection or an error occurred
      if (
        error instanceof Error &&
        error.name !== "NotAllowedError" &&
        error.name !== "AbortError"
      ) {
        console.error("Screenshot capture failed:", error);
      }
    } finally {
      setIsCapturing(false);
    }
  }, [isCapturing, onScreenshotCapture]);

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          className="rounded-xl"
          disabled={isLoading || isCapturing}
          onClick={(event) => {
            event.preventDefault();
            captureScreenshot();
          }}
          variant="ghost"
          aria-label="Capture screenshot"
        >
          <Camera size={14} />
        </Button>
      </TooltipTrigger>
      <TooltipContent>Capture screenshot</TooltipContent>
    </Tooltip>
  );
};

export const ScreenshotButton = memo(PureScreenshotButton);
