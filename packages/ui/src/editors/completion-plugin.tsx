import {
  checkResponse,
  type ErrorDictionary,
} from "@workspace/ui/lib/translation-utils";
import { debounce } from "@workspace/ui/lib/utils";
import {
  type EditorState,
  Plugin,
  PluginKey,
  TextSelection,
  type Transaction,
} from "prosemirror-state";
import { Decoration, DecorationSet } from "prosemirror-view";
import { apiFetcher } from "../lib/fetcher";

export const COMPLETION_PLUGIN_KEY = new PluginKey<CompletionState>(
  "completion"
);

interface DebouncedFunction {
  (): void;
  cancel: () => void;
}

interface CompletionState {
  decorations: DecorationSet;
  completion: string | null;
  requestInProgress: boolean;
  debouncedFetchCompletion: DebouncedFunction | null;
  currentAbortController: AbortController | null;
  autocompleteEnabled: boolean; // Add flag for autocomplete status
}

export function isCursorAtEndOfParagraph(state: EditorState): boolean {
  if (!(state.selection instanceof TextSelection) || !state.selection.$cursor)
    return false;
  const { $cursor } = state.selection;

  const node = $cursor.parent;
  return (
    node.type.name === "paragraph" && $cursor.parentOffset === node.content.size
  );
}

export function getTextBeforeCursor(state: EditorState): string {
  if (!(state.selection instanceof TextSelection) || !state.selection.$cursor) {
    return state.doc.textContent;
  }

  const { $cursor } = state.selection;

  // Since we only call this when cursor is at paragraph end,
  // we can simply get all text up to the cursor position
  // without checking node boundaries within paragraphs
  let text = "";
  state.doc.nodesBetween(0, $cursor.pos, (node) => {
    if (node.isText) {
      text += node.text;
    }
    return true;
  });

  return text;
}

async function fetchCompletion(
  context: string,
  state: CompletionState,
  errorDictionary: ErrorDictionary
): Promise<string | null> {
  if (!context.trim()) return null;

  // Cancel any ongoing request
  if (state.currentAbortController) {
    state.currentAbortController.abort();
  }

  // Create a new AbortController for this request
  const abortController = new AbortController();
  state.currentAbortController = abortController;
  state.requestInProgress = true;

  try {
    return await apiFetcher(
      "completion",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ context }),
        signal: abortController.signal,
      },
      errorDictionary
    );
  } catch (error) {
    console.log("Aborted request");

    return null;
  } finally {
    if (state.currentAbortController === abortController) {
      state.requestInProgress = false;
      state.currentAbortController = null;
    }
  }
}

function createCompletionDecoration(
  state: EditorState,
  completion: string | null
): DecorationSet {
  if (!completion) return DecorationSet.empty;

  if (
    !(state.selection instanceof TextSelection) ||
    !state.selection.$cursor ||
    !isCursorAtEndOfParagraph(state)
  ) {
    return DecorationSet.empty;
  }

  const { $cursor } = state.selection;
  const pos = $cursor.pos;

  const decoration = Decoration.widget(
    pos,
    () => {
      const span = document.createElement("span");
      span.className = "completion-suggestion";
      span.textContent = completion;
      span.style.color = "#8e8e8e";
      span.style.opacity = "0.7";
      span.style.userSelect = "none";
      span.style.pointerEvents = "none";
      return span;
    },
    { side: 1 }
  );

  return DecorationSet.create(state.doc, [decoration]);
}

/**
 * Extracts the next word from a completion string
 * Returns an object with the word to insert and the remaining completion
 */
export function extractNextWord(completion: string): {
  wordToInsert: string;
  remaining: string | null;
} {
  if (!completion) {
    return { wordToInsert: "", remaining: null };
  }

  const match = completion.match(/^(\s*\S+\s*)/);

  if (!match) {
    return { wordToInsert: completion, remaining: null };
  }

  const wordToInsert = match[0];
  const remaining = completion.slice(wordToInsert.length);

  return {
    wordToInsert,
    remaining: remaining.length > 0 ? remaining : null,
  };
}

export function updateCompletionOnTyping(
  tr: Transaction,
  oldState: EditorState,
  newState: EditorState,
  completion: string | null
): string | null {
  if (!completion || !tr.docChanged) return completion;

  if (
    !(newState.selection instanceof TextSelection) ||
    !newState.selection.$cursor
  ) {
    return null;
  }

  const oldPos = oldState.selection.$from.pos;
  const newPos = newState.selection.$from.pos;

  if (newPos <= oldPos) {
    return null;
  }

  const added = newState.doc.textBetween(oldPos, newPos);

  if (!added) {
    return null;
  }

  if (
    completion.startsWith(added) ||
    (added.charCodeAt(0) === 160 && completion.charCodeAt(0) === 32)
  ) {
    // Remove the typed part from the completion
    return completion.slice(added.length);
  } else {
    // User typed something that doesn't match the completion
    return null;
  }
}

// Create the completion plugin
export function createCompletionPlugin(
  debounceTime = 500,
  autocompleteEnabled = true,
  errorDictionary: ErrorDictionary
) {
  return new Plugin<CompletionState>({
    key: COMPLETION_PLUGIN_KEY,

    state: {
      init() {
        // Initialize plugin state
        return {
          decorations: DecorationSet.empty,
          completion: null,
          requestInProgress: false,
          debouncedFetchCompletion: null,
          currentAbortController: null,
          autocompleteEnabled,
        };
      },

      apply(tr, state, oldState, newState) {
        // If the document changed, update the completion accordingly
        if (tr.docChanged) {
          // Cancel any in-progress requests as the context has changed
          if (state.currentAbortController) {
            state.currentAbortController.abort();
            state.currentAbortController = null;
          }

          const updatedCompletion = updateCompletionOnTyping(
            tr,
            oldState,
            newState,
            state.completion
          );

          return {
            ...state,
            completion: updatedCompletion,
            decorations: createCompletionDecoration(
              newState,
              updatedCompletion
            ),
            requestInProgress: false,
          };
        }

        if (tr.selectionSet) {
          console.log("Selection changed");

          const oldNode = oldState.selection.$from.parent;
          const newNode = newState.selection.$from.parent;

          if (oldNode !== newNode) {
            // If the selection changed to a different node, clear the completion
            return {
              ...state,
              completion: null,
              decorations: DecorationSet.empty,
            };
          }

          return {
            ...state,
            decorations: createCompletionDecoration(newState, state.completion),
          };
        }

        // If there's a metadata field with completion data, update it
        const completion = tr.getMeta(COMPLETION_PLUGIN_KEY)?.completion;
        if (completion !== undefined) {
          return {
            ...state,
            completion,
            decorations: createCompletionDecoration(newState, completion),
          };
        }

        return state;
      },
    },

    props: {
      // Add decorations from this plugin to the view
      decorations(state) {
        return this.getState(state)?.decorations ?? DecorationSet.empty;
      },

      // Handle keydown events for Tab, Escape, and Cmd+Right Arrow
      handleKeyDown(view, event) {
        const pluginState = this.getState(view.state);
        if (!pluginState?.completion) return false;

        if (event.key === "Tab") {
          event.preventDefault();

          if (pluginState.completion) {
            const tr = view.state.tr.insertText(pluginState.completion);
            view.dispatch(
              tr.setMeta(COMPLETION_PLUGIN_KEY, { completion: null })
            );
            return true;
          }
        } else if (event.key === "Escape") {
          event.preventDefault();

          view.dispatch(
            view.state.tr.setMeta(COMPLETION_PLUGIN_KEY, { completion: null })
          );
          return true;
        } else if (
          event.key === "ArrowRight" &&
          (event.metaKey || event.ctrlKey)
        ) {
          // Command/Ctrl + Right Arrow to accept the next word
          event.preventDefault();

          if (pluginState.completion && isCursorAtEndOfParagraph(view.state)) {
            const { wordToInsert, remaining } = extractNextWord(
              pluginState.completion
            );

            if (wordToInsert) {
              const tr = view.state.tr.insertText(wordToInsert);
              view.dispatch(
                tr.setMeta(COMPLETION_PLUGIN_KEY, { completion: remaining })
              );
              return true;
            }
          }
        }

        return false;
      },
    },

    view(editorView) {
      // Prevent overlapping requests in the view
      const debouncedFetchCompletion = debounce(async () => {
        const state = editorView.state;
        const pluginState = COMPLETION_PLUGIN_KEY.getState(state);

        if (
          !pluginState ||
          pluginState.requestInProgress ||
          pluginState.completion ||
          !isCursorAtEndOfParagraph(state) ||
          !pluginState.autocompleteEnabled // Add check for autocomplete flag
        ) {
          return;
        }

        const textBeforeCursor = getTextBeforeCursor(state);

        if (textBeforeCursor.length < 16) return;

        const context =
          textBeforeCursor.length > 1024
            ? textBeforeCursor.slice(textBeforeCursor.length - 1024)
            : textBeforeCursor;

        try {
          const completion = await fetchCompletion(
            context,
            pluginState,
            errorDictionary
          );

          if (completion) {
            const currentState = editorView.state;
            editorView.dispatch(
              currentState.tr.setMeta(COMPLETION_PLUGIN_KEY, { completion })
            );
          }
        } catch (error) {
          console.error(error);
        }
      }, debounceTime);

      const pluginState = COMPLETION_PLUGIN_KEY.getState(editorView.state);

      if (pluginState) {
        pluginState.debouncedFetchCompletion = debouncedFetchCompletion;
      }

      return {
        update(view, prevState) {
          if (view.state.doc !== prevState.doc) {
            const pluginState = COMPLETION_PLUGIN_KEY.getState(view.state);
            pluginState?.debouncedFetchCompletion?.();
          }
        },
        destroy() {
          // Clean up
          const pluginState = COMPLETION_PLUGIN_KEY.getState(editorView.state);

          if (pluginState) {
            pluginState.debouncedFetchCompletion?.cancel();

            if (pluginState.currentAbortController) {
              pluginState.currentAbortController.abort();
              pluginState.currentAbortController = null;
            }

            pluginState.requestInProgress = false;
          }
        },
      };
    },
  });
}
