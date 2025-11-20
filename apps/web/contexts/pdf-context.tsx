"use client";

import { useEditor } from "@workspace/ui/contexts/editor-context";
import { useSharedTranslations } from "@workspace/ui/contexts/shared-translations-context";
import { apiFetcher } from "@workspace/ui/lib/fetcher";
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
import { toast } from "sonner";

interface PDFContextType {
  currentPdfUrl: string | null;
  currentFileName: string | null;
  currentPage: number;
  currentBbox: [number, number, number, number] | null;
  openPdf: (
    isMobile: boolean,
    panelRef: RefObject<ImperativePanelHandle | null>,
    courseId: string,
    filename: string,
    page?: number,
    bbox?: [number, number, number, number] | null,
  ) => Promise<void>;
  isFetching: boolean;
}

const PDFContext = createContext<PDFContextType | undefined>(undefined);

// Cache to store signed URLs with their expiration times
const urlCache = new Map<string, { url: string; expiresAt: number }>();

export function PDFProvider({ children }: { children: ReactNode }) {
  const { sharedT } = useSharedTranslations();

  const [currentPage, setCurrentPage] = useState(1);
  const [currentFileName, setCurrentFileName] = useState<string | null>(null);
  const [currentPdfUrl, setCurrentPdfUrl] = useState<string | null>(null);
  const [currentBbox, setCurrentBbox] = useState<
    [number, number, number, number] | null
  >(null);

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
      const { signedUrl } = await apiFetcher(
        (client) =>
          client["get-signed-url"][":courseId"][":name"].$get({
            param: { courseId, name: encodeURIComponent(filename) },
          }),
        sharedT.apiCodes,
      );

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
    async (
      courseId: string,
      filename: string,
      page: number,
      bbox: [number, number, number, number] | null = null,
    ) => {
      // Set the current page and bbox
      setCurrentPage(page);
      setCurrentFileName(filename);
      setCurrentBbox(bbox);

      setIsFetching(true);

      try {
        const signedUrl = await getSignedUrl(courseId, filename);
        setCurrentPdfUrl(signedUrl);
        setEditorMode("pdf");
      } catch (error) {
        console.error("Error loading PDF:", error);

        toast.error("Failed to load PDF. Please try again later.");
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
      bbox: [number, number, number, number] | null = null,
    ) => {
      console.log("Opening PDF with bbox:", bbox);

      if (isMobile) {
        try {
          const signedUrl = await getSignedUrl(courseId, filename);
          window.open(signedUrl, "_blank");
        } catch (error) {
          console.error("Error opening PDF on mobile:", error);

          toast.error("Failed to open PDF. Please try again later.");
        }
      } else {
        resizeEditor(panelRef, false);
        loadPdf(courseId, filename, page, bbox);
      }
    },
    [getSignedUrl, loadPdf],
  );

  return (
    <PDFContext.Provider
      value={{
        currentPdfUrl,
        currentPage,
        currentFileName,
        currentBbox,
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
