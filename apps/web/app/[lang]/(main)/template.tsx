"use client";

import { EditorFooter } from "@/components/editors/editor-footer";
import { EditorHeader } from "@/components/editors/editor-header";
import { PdfHeader } from "@/components/editors/pdf-header";
import { PDFViewer } from "@/components/sidebars/pdf-viewer";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@workspace/ui/components/resizable";
import { useEditor } from "@workspace/ui/contexts/editor-context";
import { useRefs } from "@workspace/ui/contexts/refs-context";
import { EditorWrapper } from "@workspace/ui/custom-components/editor-wrapper";
import { useIsMobile } from "@workspace/ui/hooks/use-mobile";
import { usePathname } from "next/navigation";
import { useEffect } from "react";

// const EditorWrapper = dynamic(() =>
//   import("@/components/editors/editor-wrapper").then((mod) => mod.EditorWrapper)
// );

export default function Template({ children }: { children: React.ReactNode }) {
  const { panelRef, setSize } = useRefs();
  const [editorMode] = useEditor();

  const pathname = usePathname();

  const isMobile = useIsMobile();

  const minSize = isMobile ? 50 : 35;
  const maxSize = isMobile ? 50 : 70;

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "i" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        if (panelRef.current?.isCollapsed()) {
          panelRef.current?.expand();
        } else {
          panelRef.current?.collapse();
        }
      }
    };

    window.addEventListener("keydown", down);
    return () => window.removeEventListener("keydown", down);
  }, []);

  return (
    <ResizablePanelGroup direction="horizontal">
      <ResizablePanel className="h-svh" defaultSize={100} collapsible>
        {children}
      </ResizablePanel>
      <ResizableHandle withHandle />
      <ResizablePanel
        className="flex h-svh flex-col"
        ref={panelRef}
        defaultSize={0}
        onResize={(size) => {
          setSize(size);
          if (size < minSize) {
            panelRef.current?.collapse();
          } else if (size >= maxSize) {
            panelRef.current?.resize(100);
          }
        }}
        collapsible
      >
        {editorMode === "pdf" ? (
          <>
            <PdfHeader />
            <PDFViewer />
          </>
        ) : (
          <>
            <EditorHeader />
            <EditorWrapper />
            {pathname.includes("practice") && <EditorFooter />}
          </>
        )}
      </ResizablePanel>
    </ResizablePanelGroup>
  );
}
