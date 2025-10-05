"use client";

import { usePdf } from "@/contexts/pdf-context";
import { useWebTranslations } from "@/contexts/web-translations";
import { useState } from "react";

export const PDFViewer = () => {
  const { webT } = useWebTranslations();
  const { currentPdfUrl, currentPage, isFetching } = usePdf();

  const [error, setError] = useState<string | null>(null);

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
    ? `${currentPdfUrl}#page=${currentPage}&zoom=67`
    : undefined;

  return (
    <div className="relative flex-1 overflow-auto">
      {pdfUrlWithPage && (
        <iframe
          key={`pdf-viewer-${currentPdfUrl}-page-${currentPage}`}
          src={pdfUrlWithPage}
          className="size-full"
          title="PDF Viewer"
          onError={() => {
            setError("Failed to load PDF");
          }}
          loading="lazy"
        />
      )}
    </div>
  );
};
