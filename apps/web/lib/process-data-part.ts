import { type EditorState as CodeEditorState } from "@codemirror/state";
import { type EditorView as CodeEditorView } from "@codemirror/view";
import { type QueryClient } from "@tanstack/react-query";
import { type MyUIDataTypes } from "@workspace/api-routes/types/custom-ui-data-types";
import { type EditorMode } from "@workspace/ui/contexts/editor-context";
import { diffLines } from "@workspace/ui/editors/jsdiff/line";
import { type EditorContent } from "@workspace/ui/editors/text-editor";
import {
  appendContentToCodeEditor,
  updateCodeEditorWithDispatch,
} from "@workspace/ui/editors/utils";
import { resizeEditor } from "@workspace/ui/lib/utils";
import { type DataUIPart } from "ai";
import { type EditorState as TextEditorState } from "prosemirror-state";
import { type EditorView as TextEditorView } from "prosemirror-view";
import { type Dispatch, type RefObject, type SetStateAction } from "react";
import { type ImperativePanelHandle } from "react-resizable-panels";
import { createDiffViewString } from "./utils";

export const processDataPart = async ({
  chatId,
  queryClient,
  dataPart,
  panelRef,
  textEditorRef,
  codeEditorRef,
  editorMode,
  setEditorMode,
  localTextEditorContent,
  setLocalTextEditorContent,
  textDiffPrev,
  setTextDiffNext,
  localCodeEditorContent,
  setLocalCodeEditorContent,
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
  localTextEditorContent: EditorContent;
  setLocalTextEditorContent: Dispatch<SetStateAction<EditorContent>>;
  textDiffPrev: RefObject<TextEditorState | undefined>;
  setTextDiffNext: Dispatch<SetStateAction<string>>;
  localCodeEditorContent: EditorContent;
  setLocalCodeEditorContent: Dispatch<SetStateAction<EditorContent>>;
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
        if (!textEditorRef.current) {
          console.warn(
            "Text editor reference is null when switching to text mode.",
          );
          return;
        }

        // Prevent overwriting unsaved changes
        if (
          localTextEditorContent.id !== dataPart.data.id &&
          textEditorRef.current.state.doc.content.size
        ) {
          return;
        }

        // Update local storage input
        // This should also update the editor header
        if (localTextEditorContent.id !== dataPart.data.id) {
          setLocalTextEditorContent({
            id: dataPart.data.id,
            title: dataPart.data.title,
            content: "",
          });
        }

        // Dynamically import the updateTextEditorWithDispatch function
        const { updateTextEditorWithDispatch } = await import(
          "@workspace/ui/editors/text-editor"
        );

        // Save current state for diffing later and clear editor
        textDiffPrev.current = textEditorRef.current.state;
        updateTextEditorWithDispatch(textEditorRef, "");

        // Disable editing while streaming
        textEditorRef.current.setProps({ editable: () => false });
      } else if (dataPart.data.kind === "code") {
        if (!codeEditorRef.current) {
          console.warn(
            "Code editor reference is null when switching to code mode.",
          );
          return;
        }

        // Prevent overwriting unsaved changes
        if (
          localCodeEditorContent.id !== dataPart.data.id &&
          codeEditorRef.current.state.doc.length
        ) {
          return;
        }

        // Update local storage input
        // This should also update the editor header
        if (localCodeEditorContent.id !== dataPart.data.id) {
          setLocalCodeEditorContent({
            id: dataPart.data.id,
            title: dataPart.data.title,
            content: "",
          });
        }

        // Save current state for diffing later and clear editor
        codeDiffPrev.current = codeEditorRef.current.state;
        updateCodeEditorWithDispatch(codeEditorRef, "");

        // Dynamically Import StateEffect, EditorView
        const { StateEffect } = await import("@codemirror/state");
        const { EditorView } = await import("@codemirror/view");

        // Create a transaction that reconfigures the editable facet to false
        // This disables editing while streaming
        const effect = StateEffect.reconfigure.of([
          EditorView.editable.of(false),
        ]);
        codeEditorRef.current.dispatch({ effects: effect });
      }

      resizeEditor(panelRef, false);
      break;

    case "data-text-delta":
      console.log("Text delta event received: ", dataPart.data);

      // If there's no previous state, dont append deltas
      if (!textDiffPrev.current) {
        return;
      }

      // Dynamically import the appendContentToTextEditor function
      const { appendContentToTextEditor } = await import(
        "@workspace/ui/editors/text-editor"
      );

      appendContentToTextEditor(textEditorRef, dataPart.data);
      break;

    case "data-code-delta":
      console.log("Code delta event received: ", dataPart.data);

      if (!codeDiffPrev.current) {
        return;
      }

      appendContentToCodeEditor(codeEditorRef, dataPart.data);
      break;

    case "data-finish":
      console.log("Finish event received: ", dataPart);

      if (editorMode === "text") {
        if (!textDiffPrev.current || !textEditorRef.current) {
          console.warn(
            "Text editor reference is null when processing finish event.",
          );
          return;
        }

        // Dynamically import the mathMarkdownSerializer
        // and diffSentences function
        const { mathMarkdownSerializer } = await import(
          "@workspace/ui/editors/prosemirror-math/utils/text-serializer"
        );
        const { diffSentences } = await import(
          "@workspace/ui/editors/jsdiff/sentence"
        );
        const { updateTextEditorWithDispatch } = await import(
          "@workspace/ui/editors/text-editor"
        );

        const prevContent = mathMarkdownSerializer.serialize(
          textDiffPrev.current.doc,
        );

        const content = mathMarkdownSerializer.serialize(
          textEditorRef.current.state.doc,
        );

        setTextDiffNext(content);
        const diffResult = diffSentences(prevContent, content);

        updateTextEditorWithDispatch(
          textEditorRef,
          createDiffViewString(diffResult, true),
        );
      } else if (editorMode === "code") {
        if (!codeEditorRef.current || !codeDiffPrev.current) {
          console.warn(
            "Code editor reference is null when processing finish event.",
          );
          return;
        }

        const content = codeEditorRef.current.state.doc.toString();

        setCodeDiffNext(content);
        const diffResult = diffLines(
          codeDiffPrev.current.doc.toString(),
          content,
        );

        updateCodeEditorWithDispatch(
          codeEditorRef,
          createDiffViewString(diffResult, true),
        );
      }
      break;

    default:
      console.error("Unknown data stream delta type: ", dataPart);
      break;
  }
};
