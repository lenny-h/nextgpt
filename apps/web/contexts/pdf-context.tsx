"use client";

import { checkResponse } from "@workspace/ui/lib/translation-utils";
import { resizeEditor } from "@workspace/ui/lib/utils";
import {
  createContext,
  type ReactNode,
  type RefObject,
  useCallback,
  useContext,
  useState,
} from "react";
import { type ImperativePanelHandle } from "react-resizable-panels";
import { useEditor } from "./editor-context";
import { useGlobalTranslations } from "./web-translations";

interface PDFContextType {
  currentPdfUrl: string | null;
  currentPage: number;
  currentFileName: string | null;
  openPdf: (
    isMobile: boolean,
    panelRef: RefObject<ImperativePanelHandle | null>,
    courseId: string,
    filename: string,
    page?: number,
  ) => Promise<void>;
  isFetching: boolean;
}

const PDFContext = createContext<PDFContextType | undefined>(undefined);

// Cache to store signed URLs with their expiration times
const urlCache = new Map<string, { url: string; expiresAt: number }>();

export function PDFProvider({ children }: { children: ReactNode }) {
  const { globalT } = useGlobalTranslations();

  const [currentPage, setCurrentPage] = useState(1);
  const [currentFileName, setCurrentFileName] = useState<string | null>(null);
  const [currentPdfUrl, setCurrentPdfUrl] = useState<string | null>(null);

  const [, setEditorMode] = useEditor();

  const [isFetching, setIsFetching] = useState(false);

  const getSignedUrl = useCallback(
    async (courseId: string, filename: string): Promise<string> => {
      // Create a cache key for this file
      const cacheKey = `${courseId}:${filename}`;

      // Check if we have a cached URL that's still valid
      const cached = urlCache.get(cacheKey);
      const now = Date.now();

      if (cached && cached.expiresAt > now) {
        return cached.url;
      }

      // Otherwise, fetch a new signed URL
      const response = await fetch(
        `${
          process.env.NEXT_PUBLIC_API_URL
        }/capi/protected/get-signed-url/${courseId}/${encodeURIComponent(filename)}`,
        {
          method: "GET",
          credentials: "include",
        },
      );

      checkResponse(response, globalT.globalErrors);

      const { signedUrl } = await response.json();

      // Cache the URL with its expiration time (3 hours from now)
      urlCache.set(cacheKey, {
        url: signedUrl,
        expiresAt: now + 180 * 60 * 1000, // 3 hours
      });

      return signedUrl;
    },
    [],
  );

  const loadPdf = useCallback(
    async (courseId: string, filename: string, page: number) => {
      // Set the current page
      setCurrentPage(page);
      setCurrentFileName(filename);

      setIsFetching(true);

      try {
        const signedUrl = await getSignedUrl(courseId, filename);
        setCurrentPdfUrl(signedUrl);
        setEditorMode("pdf");
      } catch (error) {
        console.error("Error loading PDF:", error);
      } finally {
        setIsFetching(false);
      }
    },
    [getSignedUrl, setEditorMode],
  );

  const openPdf = useCallback(
    async (
      isMobile: boolean,
      panelRef: RefObject<ImperativePanelHandle | null>,
      courseId: string,
      filename: string,
      page = 1,
    ) => {
      if (isMobile) {
        const signedUrl = await getSignedUrl(courseId, filename);
        window.open(signedUrl, "_blank");
      } else {
        resizeEditor(panelRef, false);
        loadPdf(courseId, filename, page);
      }
    },
    [getSignedUrl],
  );

  return (
    <PDFContext.Provider
      value={{
        currentPdfUrl,
        currentPage,
        currentFileName,
        openPdf,
        isFetching,
      }}
    >
      {children}
    </PDFContext.Provider>
  );
}

export function usePdf() {
  const context = useContext(PDFContext);
  if (context === undefined) {
    throw new Error("usePdf must be used within a PDFProvider");
  }
  return context;
}
