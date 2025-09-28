import { type EditorMode } from "@/contexts/editor-context";
import { type EditorContent } from "@/contexts/text-editor-content-context";
import { type MyUIDataTypes } from "@/types/custom-ui-data-types";
import { type EditorState as CodeEditorState } from "@codemirror/state";
import { type EditorView as CodeEditorView } from "@codemirror/view";
import { type QueryClient } from "@tanstack/react-query";
import { diffLines } from "@workspace/ui/editors/jsdiff/line";
import { diffSentences } from "@workspace/ui/editors/jsdiff/sentence";
import { resizeEditor } from "@workspace/ui/lib/utils";
import { type DataUIPart } from "ai";
import { type EditorState as TextEditorState } from "prosemirror-state";
import { type EditorView as TextEditorView } from "prosemirror-view";
import { type Dispatch, type RefObject, type SetStateAction } from "react";
import { type ImperativePanelHandle } from "react-resizable-panels";
import { createDiffViewString } from "./utils";

export const processDataPart = ({
  chatId,
  queryClient,
  dataPart,
  panelRef,
  textEditorRef,
  codeEditorRef,
  editorMode,
  setEditorMode,
  textEditorContent,
  setTextEditorContent,
  textDiffPrev,
  diffPrevString,
  setDiffPrevString,
  setTextDiffNext,
  codeEditorContent,
  setCodeEditorContent,
  codeDiffPrev,
  setCodeDiffNext,
}: {
  chatId: string;
  queryClient: QueryClient;
  dataPart: DataUIPart<MyUIDataTypes>;
  panelRef: RefObject<ImperativePanelHandle | null>;
  textEditorRef: RefObject<TextEditorView | null>;
  codeEditorRef: RefObject<CodeEditorView | null>;
  editorMode: EditorMode;
  setEditorMode: Dispatch<SetStateAction<EditorMode>>;
  textEditorContent: EditorContent;
  setTextEditorContent: Dispatch<SetStateAction<EditorContent>>;
  textDiffPrev: RefObject<TextEditorState | undefined>;
  diffPrevString: string;
  setDiffPrevString: Dispatch<SetStateAction<string>>;
  setTextDiffNext: Dispatch<SetStateAction<string>>;
  codeEditorContent: EditorContent;
  setCodeEditorContent: Dispatch<SetStateAction<EditorContent>>;
  codeDiffPrev: RefObject<CodeEditorState | undefined>;
  setCodeDiffNext: Dispatch<SetStateAction<string>>;
}) => {
  switch (dataPart.type) {
    case "data-chat":
      queryClient.invalidateQueries({ queryKey: ["chats"] });
      queryClient.invalidateQueries({ queryKey: ["chatTitle", chatId] });
      break;

    case "data-kind":
      console.log("Kind event received: ", dataPart);

      setEditorMode(dataPart.data.kind);

      if (dataPart.data.kind === "text") {
        textDiffPrev.current = textEditorRef.current?.state;

        setDiffPrevString(textEditorContent.content);

        setTextEditorContent({
          id: dataPart.data.id,
          title: dataPart.data.title,
          content: "",
        });
      } else if (dataPart.data.kind === "code") {
        codeDiffPrev.current = codeEditorRef.current?.state;

        setCodeEditorContent({
          id: dataPart.data.id,
          title: dataPart.data.title,
          content: "",
        });
      }

      resizeEditor(panelRef, false);
      break;

    case "data-text-delta":
      console.log("Text delta event received: ", dataPart.data);

      setTextEditorContent((prev) => ({
        ...prev,
        content: prev.content + dataPart.data,
      }));
      break;

    case "data-code-delta":
      console.log("Code delta event received: ", dataPart.data);

      setCodeEditorContent((prev) => {
        return {
          ...prev,
          content: prev.content + dataPart.data,
        };
      });
      break;

    case "data-finish":
      console.log("Finish event received: ", dataPart);

      if (editorMode === "text") {
        setTextDiffNext(textEditorContent.content);

        setTextEditorContent((prev) => {
          const diffResult = diffSentences(diffPrevString, prev.content);

          return {
            ...prev,
            content: createDiffViewString(diffResult, true),
          };
        });
      } else if (editorMode === "code") {
        setCodeDiffNext(codeEditorContent.content);

        setCodeEditorContent((prev) => {
          const diffResult = diffLines(
            codeDiffPrev.current!.doc.toString(),
            prev.content
          );

          return {
            ...prev,
            content: createDiffViewString(diffResult, false),
          };
        });
      }
      break;

    default:
      console.error("Unknown data stream delta type: ", dataPart);
      break;
  }
};
