import * as m from "motion/react-m";

import { useEditor } from "@/contexts/editor-context";
import { useRefs } from "@/contexts/refs-context";
import { resizeEditor } from "@workspace/ui/lib/utils";
import { Check, Copy, Pencil } from "lucide-react";
import { LazyMotion } from "motion/react";
import { useState } from "react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { prism } from "react-syntax-highlighter/dist/esm/styles/prism";
import { useCopyToClipboard } from "usehooks-ts";
import { updateCodeEditorWithDispatch } from "../editors/utils";

const loadFeatures = () => import("@/lib/features").then((res) => res.default);

interface CodeBlockProps {
  children: string;
  language: string;
  className?: string;
  style?: React.CSSProperties;
}

export const CodeBlock = ({
  children,
  language,
  className,
  style,
  ...props
}: CodeBlockProps) => {
  const { panelRef, codeEditorRef } = useRefs();
  const [, setEditorMode] = useEditor();

  const [copied, setCopied] = useState(false);
  const [edited, setEdited] = useState(false);
  const [_, copyToClipboard] = useCopyToClipboard();

  return (
    <div className="relative w-full overflow-x-scroll">
      <div className="flex items-center justify-between rounded-t-lg border border-b-0 bg-slate-800 px-4 py-1">
        <div className="text-primary font-mono">{language}</div>
        <div className="flex space-x-2">
          <button
            className="flex cursor-pointer items-center space-x-1 text-slate-50"
            onClick={async () => {
              await copyToClipboard(String(children));
              setCopied(true);
              setTimeout(() => {
                setCopied(false);
              }, 3500);
            }}
          >
            {copied ? (
              <LazyMotion features={loadFeatures}>
                <m.div
                  initial={{ scale: 0.95, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                >
                  <Check size={14} className="text-green-500" />
                </m.div>
              </LazyMotion>
            ) : (
              <Copy size={14} />
            )}
            <span className="text-xs">Copy</span>
          </button>
          <button
            className="flex cursor-pointer items-center space-x-1 text-slate-50"
            onClick={async () => {
              setEditorMode("code");
              resizeEditor(panelRef, false);

              updateCodeEditorWithDispatch(codeEditorRef, String(children));

              setEdited(true);
              setTimeout(() => {
                setEdited(false);
              }, 3500);
            }}
          >
            {edited ? (
              <LazyMotion features={loadFeatures}>
                <m.div
                  initial={{ scale: 0.95, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                >
                  <Check size={14} className="text-green-500" />
                </m.div>
              </LazyMotion>
            ) : (
              <Pencil size={14} />
            )}
            <span className="text-xs">Edit</span>
          </button>
        </div>
      </div>
      <SyntaxHighlighter
        PreTag="div"
        language={language}
        style={prism}
        customStyle={{ marginTop: 0 }}
        className="rounded-b-lg border border-t-0 text-sm"
        {...props}
      >
        {String(children).replace(/\n$/, "")}
      </SyntaxHighlighter>
    </div>
  );
};
