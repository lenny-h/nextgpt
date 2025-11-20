"use client";

import { usePdf } from "@/contexts/pdf-context";
import { useWebTranslations } from "@/contexts/web-translations";
import { useEffect, useRef, useState } from "react";

// Standard PDF page dimensions in points (US Letter at 72 DPI: 8.5" x 11")
const PDF_PAGE_WIDTH = 612; // 8.5"
const PDF_PAGE_HEIGHT = 792; // 11"

export const PDFViewer = () => {
  const { webT } = useWebTranslations();
  const { currentPdfUrl, currentPage, currentBbox, isFetching } = usePdf();

  const [error, setError] = useState<string | null>(null);
  const [showBbox, setShowBbox] = useState(false);
  const [iframeScale, setIframeScale] = useState({ width: 0, height: 0 });
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Calculate iframe scale based on container dimensions
  useEffect(() => {
    const updateScale = () => {
      if (containerRef.current) {
        const containerWidth = containerRef.current.clientWidth;
        const containerHeight = containerRef.current.clientHeight;

        setIframeScale({
          width: containerWidth,
          height: containerHeight,
        });
      }
    };

    updateScale();
    window.addEventListener("resize", updateScale);
    return () => window.removeEventListener("resize", updateScale);
  }, []);

  // Show bbox temporarily when it changes
  useEffect(() => {
    if (currentBbox) {
      console.log("PDFViewer - New bbox received:", currentBbox);
      setShowBbox(true);

      const timer = setTimeout(() => {
        console.log("PDFViewer - Hiding bbox after 3 seconds");
        setShowBbox(false);
      }, 3000);

      return () => clearTimeout(timer);
    } else {
      setShowBbox(false);
    }
  }, [currentBbox, currentPage, currentPdfUrl]);

  if (!currentPdfUrl) {
    return (
      <div className="bg-muted/20 flex flex-1 items-center justify-center">
        <p className="text-muted-foreground">{webT.pdfViewer.noPdfSelected}</p>
      </div>
    );
  }

  if (isFetching) {
    return (
      <div className="bg-muted/20 flex flex-1 items-center justify-center">
        <p className="text-muted-foreground">{webT.pdfViewer.authenticating}</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-muted/20 flex flex-1 items-center justify-center">
        <p className="text-red-500">{webT.pdfViewer.failedToLoadPdf}</p>
      </div>
    );
  }

  const pdfUrlWithPage = currentPdfUrl
    ? `${currentPdfUrl}#page=${currentPage}`
    : undefined;

  return (
    <div ref={containerRef} className="relative flex-1 overflow-auto">
      {pdfUrlWithPage && (
        <>
          <div className="relative size-full">
            <iframe
              ref={iframeRef}
              key={`pdf-viewer-${currentPdfUrl}-page-${currentPage}`}
              src={pdfUrlWithPage}
              className="size-full"
              title="PDF Viewer"
              onError={() => {
                setError("Failed to load PDF");
              }}
              loading="lazy"
            />
            {showBbox &&
              currentBbox &&
              iframeScale.width > 0 &&
              (() => {
                const [x0, y0, x1, y1] = currentBbox;

                // PDF.js typically renders the page to fit the container width
                // Calculate the scale factor based on container width
                const scale = iframeScale.width / PDF_PAGE_WIDTH;
                const renderedPageHeight = PDF_PAGE_HEIGHT * scale;

                // Convert PDF coordinates to pixel positions
                // Note: PDF coordinates are from bottom-left, but we need top-left
                const topPx = (PDF_PAGE_HEIGHT - y1) * scale;
                const heightPx = (y1 - y0) * scale;
                const leftPx = x0 * scale;
                const widthPx = (x1 - x0) * scale;

                console.log("PDFViewer - Rendering bbox highlight:", {
                  bbox: { x0, y0, x1, y1 },
                  containerScale: iframeScale,
                  scale,
                  renderedPageHeight,
                  pixels: {
                    top: topPx,
                    height: heightPx,
                    left: leftPx,
                    width: widthPx,
                  },
                });

                return (
                  <div
                    className="border-primary bg-primary/20 pointer-events-none absolute animate-pulse border-4"
                    style={{
                      left: `${leftPx}px`,
                      top: `${topPx}px`,
                      width: `${widthPx}px`,
                      height: `${heightPx}px`,
                      zIndex: 1000,
                    }}
                  />
                );
              })()}
          </div>
        </>
      )}
    </div>
  );
};
