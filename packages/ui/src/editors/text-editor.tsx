"use client";

import { useAutocomplete } from "@workspace/ui/contexts/autocomplete-context";
import { useSharedTranslations } from "@workspace/ui/contexts/shared-translations-context";
import { createCompletionPlugin } from "@workspace/ui/editors/completion-plugin";
import { buildDocumentFromContent } from "@workspace/ui/editors/functions";
import {
  plugins,
  textEditorSchema,
} from "@workspace/ui/editors/prosemirror-math/config";
import {
  mathMarkdownSerializer,
  mathTextSerializer,
} from "@workspace/ui/editors/prosemirror-math/utils/text-serializer";
import { exampleSetup } from "prosemirror-example-setup";
import { EditorState } from "prosemirror-state";
import { EditorView } from "prosemirror-view";
import { memo, useEffect, useRef } from "react";
import { useLocalStorage } from "usehooks-ts";

import "./prosemirror-math/styles.css";

export type EditorContent = {
  id?: string;
  title: string;
  content: string;
};

type EditorProps = {
  textEditorRef: React.RefObject<EditorView | null>;
};

export const TextEditor = memo(({ textEditorRef: editorRef }: EditorProps) => {
  const { sharedT } = useSharedTranslations();

  const containerRef = useRef<HTMLDivElement>(null);

  const [autocomplete] = useAutocomplete();
  const [localStorageInput, setLocalStorageInput] =
    useLocalStorage<EditorContent>("text-editor-input", {
      id: undefined,
      title: "",
      content: "",
    });

  useEffect(() => {
    console.log("Initializing text editor");

    if (containerRef.current && !editorRef.current) {
      const state = EditorState.create({
        doc: buildDocumentFromContent(localStorageInput.content),
        plugins: [
          ...exampleSetup({ schema: textEditorSchema, menuBar: false }),
          createCompletionPlugin(650, autocomplete.text, sharedT.apiCodes),
          ...plugins,
        ],
        schema: textEditorSchema,
      });

      editorRef.current = new EditorView(containerRef.current, {
        state,
        clipboardTextSerializer: (slice) => {
          return mathTextSerializer.serializeSlice(slice);
        },
      });
    }

    return () => {
      if (editorRef.current) {
        syncTextEditorContentToLocalStorage(editorRef, setLocalStorageInput);

        editorRef.current.destroy();
        editorRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (editorRef.current) {
      localStorage.setItem(
        "autocomplete",
        JSON.stringify({
          ...autocomplete,
          text: autocomplete.text,
        })
      );

      const newState = EditorState.create({
        doc: editorRef.current.state.doc,
        plugins: [
          ...exampleSetup({ schema: textEditorSchema, menuBar: false }),
          createCompletionPlugin(650, autocomplete.text, sharedT.apiCodes),
          ...plugins,
        ],
        schema: textEditorSchema,
      });

      editorRef.current.updateState(newState);
    }
  }, [autocomplete.text]);

  return (
    <div
      className="prose dark:prose-invert relative p-2"
      ref={containerRef}
      spellCheck={false}
    />
  );
});

export function syncTextEditorContentToLocalStorage(
  editorRef: React.RefObject<EditorView | null>,
  setLocalStorageInput: React.Dispatch<React.SetStateAction<EditorContent>>
) {
  if (!editorRef.current) return;

  const content = mathMarkdownSerializer.serialize(editorRef.current.state.doc);

  setLocalStorageInput((prev) => ({
    ...prev,
    content,
  }));
}

export function updateTextEditorWithDispatch(
  editorRef: React.RefObject<EditorView | null>,
  content: string
) {
  if (!editorRef.current) return;

  const newDoc = buildDocumentFromContent(content);
  const tr = editorRef.current.state.tr.replaceWith(
    0,
    editorRef.current.state.doc.content.size,
    newDoc.content
  );
  editorRef.current.dispatch(tr);
}

export function appendContentToTextEditor(
  editorRef: React.RefObject<EditorView | null>,
  contentToAppend: string
) {
  if (!editorRef.current) return;

  const newDoc = buildDocumentFromContent(contentToAppend);
  const tr = editorRef.current.state.tr.insert(
    editorRef.current.state.doc.content.size,
    newDoc.content
  );
  editorRef.current.dispatch(tr);
}
