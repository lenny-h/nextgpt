"use client";

import { useAutocomplete } from "@/contexts/autocomplete-context";
import { useTextEditorContent } from "@/contexts/text-editor-content-context";
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

import { useSharedTranslations } from "@workspace/ui/contexts/shared-translations-context";
import "./prosemirror-math/styles.css";

type EditorProps = {
  textEditorRef: React.RefObject<EditorView | null>;
};

export const TextEditor = memo(({ textEditorRef: editorRef }: EditorProps) => {
  const { sharedT } = useSharedTranslations();

  const { textEditorContent, setTextEditorContent } = useTextEditorContent();

  const containerRef = useRef<HTMLDivElement>(null);

  const [autocomplete] = useAutocomplete();
  const [localStorageInput, setLocalStorageInput] = useLocalStorage(
    "text-editor-input",
    "",
  );

  useEffect(() => {
    console.log("Initializing text editor");

    if (containerRef.current && !editorRef.current) {
      const state = EditorState.create({
        doc: buildDocumentFromContent(textEditorContent.content),
        plugins: [
          ...exampleSetup({ schema: textEditorSchema, menuBar: false }),
          ...plugins,
          createCompletionPlugin(650, autocomplete.text, sharedT.apiCodes),
        ],
        schema: textEditorSchema,
      });

      editorRef.current = new EditorView(containerRef.current, {
        state,
        clipboardTextSerializer: (slice) => {
          return mathTextSerializer.serializeSlice(slice);
        },
      });

      if (!textEditorContent.content) {
        console.log(localStorageInput);

        setTextEditorContent((prev) => ({
          ...prev,
          content: localStorageInput.replace(/\$\$(.*?)\$\$/g, "$$$1$$"),
        }));
      }
    }

    return () => {
      if (editorRef.current) {
        const content = mathMarkdownSerializer.serialize(
          editorRef.current.state.doc,
        );

        setTextEditorContent((prev) => ({
          ...prev,
          content,
        }));

        editorRef.current.destroy();
        editorRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (editorRef.current) {
      const newDoc = buildDocumentFromContent(textEditorContent.content);
      const tr = editorRef.current.state.tr.replaceWith(
        0,
        editorRef.current.state.doc.content.size,
        newDoc.content,
      );
      editorRef.current.dispatch(tr);
    }
  }, [textEditorContent.content]);

  useEffect(() => {
    if (editorRef.current) {
      localStorage.setItem(
        "autocomplete",
        JSON.stringify({
          ...autocomplete,
          text: autocomplete.text,
        }),
      );

      const newState = EditorState.create({
        doc: editorRef.current.state.doc,
        plugins: [
          ...exampleSetup({ schema: textEditorSchema, menuBar: false }),
          ...plugins,
          createCompletionPlugin(650, autocomplete.text, sharedT.apiCodes),
        ],
        schema: textEditorSchema,
      });

      editorRef.current.updateState(newState);
    }
  }, [autocomplete.text]);

  useEffect(() => {
    if (!editorRef.current) {
      return;
    }

    const saveInterval = setInterval(() => {
      if (editorRef.current) {
        const content = mathMarkdownSerializer.serialize(
          editorRef.current.state.doc,
        );
        setLocalStorageInput(content);
      }
    }, 15000);

    return () => {
      clearInterval(saveInterval);
    };
  }, [editorRef.current, setLocalStorageInput]);

  return (
    <div
      className="prose dark:prose-invert relative p-2"
      ref={containerRef}
      spellCheck={false}
    />
  );
});
