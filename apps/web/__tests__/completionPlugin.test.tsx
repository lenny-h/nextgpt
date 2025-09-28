import {
  extractNextWord,
  getTextBeforeCursor,
  isCursorAtEndOfParagraph,
  updateCompletionOnTyping,
} from "@workspace/ui/editors/completion-plugin";
import { Schema } from "prosemirror-model";
import { EditorState, TextSelection } from "prosemirror-state";
import { describe, expect, it } from "vitest";

// Create a minimal schema for testing
const schema = new Schema({
  nodes: {
    doc: {
      content: "paragraph+",
    },
    paragraph: {
      content: "text*",
      toDOM() {
        return ["p", 0];
      },
    },
    text: {
      toDOM() {
        return ["span", 0];
      },
    },
  },
});

describe("isCursorAtEndOfParagraph function", () => {
  it("should return true when cursor is at the end of paragraph", () => {
    // Create a test document with one paragraph
    const doc = schema.node("doc", {}, [
      schema.node("paragraph", {}, [schema.text("Test paragraph")]),
    ]);

    // Create a state with cursor at the end of the paragraph
    const selection = TextSelection.create(doc, 15); // Position after 'Test paragraph'
    const state = EditorState.create({ doc, selection });

    expect(isCursorAtEndOfParagraph(state)).toBe(true);
  });

  it("should return false when cursor is not at the end of paragraph", () => {
    // Create a test document with one paragraph
    const doc = schema.node("doc", {}, [
      schema.node("paragraph", {}, [schema.text("Test paragraph")]),
    ]);

    // Create a state with cursor in the middle of the paragraph
    const selection = TextSelection.create(doc, 7); // Position at 'Test pa|ragraph'
    const state = EditorState.create({ doc, selection });

    expect(isCursorAtEndOfParagraph(state)).toBe(false);
  });
});

describe("getTextBeforeCursor function", () => {
  it("should get text before cursor position", () => {
    // Create a test document with one paragraph
    const doc = schema.node("doc", {}, [
      schema.node("paragraph", {}, [schema.text("First paragraph")]),
      schema.node("paragraph", {}, [schema.text("Second paragraph")]),
    ]);

    // Create a state with cursor at the end of the second paragraph
    const selection = TextSelection.create(doc, 31); // Position after both paragraphs
    const state = EditorState.create({ doc, selection });

    expect(getTextBeforeCursor(state)).toBe("First paragraphSecond paragraph");
  });
});

describe("updateCompletionOnTyping function", () => {
  it("should update completion when user types characters matching the beginning of completion", () => {
    // Create a transaction that simulates typing 'te'
    const oldDoc = schema.node("doc", {}, [
      schema.node("paragraph", {}, [schema.text("Test")]),
    ]);
    const newDoc = schema.node("doc", {}, [
      schema.node("paragraph", {}, [schema.text("Testin")]),
    ]);

    const oldSelection = TextSelection.create(oldDoc, 5);
    const newSelection = TextSelection.create(newDoc, 7);

    const oldState = EditorState.create({
      doc: oldDoc,
      selection: oldSelection,
    });
    const newState = EditorState.create({
      doc: newDoc,
      selection: newSelection,
    });

    const tr = {
      docChanged: true,
    };

    const completion = "ing";

    // The function should return "g" after typing "in"
    const result = updateCompletionOnTyping(
      tr as any,
      oldState,
      newState,
      completion
    );

    expect(result).toBe("g");
  });

  it("should return null when typed text doesn't match completion", () => {
    // Create a transaction that simulates typing 'x'
    const oldDoc = schema.node("doc", {}, [
      schema.node("paragraph", {}, [schema.text("Test")]),
    ]);
    const newDoc = schema.node("doc", {}, [
      schema.node("paragraph", {}, [schema.text("Test x")]),
    ]);

    const oldSelection = TextSelection.create(oldDoc, 4);
    const newSelection = TextSelection.create(newDoc, 6);

    const oldState = EditorState.create({
      doc: oldDoc,
      selection: oldSelection,
    });
    const newState = EditorState.create({
      doc: newDoc,
      selection: newSelection,
    });

    const tr = {
      docChanged: true,
    };

    const completion = "test string";

    // The function should return null when typing 'x' because it doesn't match 't'
    const result = updateCompletionOnTyping(
      tr as any,
      oldState,
      newState,
      completion
    );

    expect(result).toBe(null);
  });
});

describe("extractNextWord function", () => {
  it("should extract the first word with trailing space", () => {
    const { wordToInsert, remaining } = extractNextWord("hello world");
    expect(wordToInsert).toBe("hello ");
    expect(remaining).toBe("world");
  });

  it("should handle single word completions", () => {
    const { wordToInsert, remaining } = extractNextWord("hello");
    expect(wordToInsert).toBe("hello");
    expect(remaining).toBe(null);
  });

  it("should handle empty string", () => {
    const { wordToInsert, remaining } = extractNextWord("");
    expect(wordToInsert).toBe("");
    expect(remaining).toBe(null);
  });

  it("should handle leading whitespace", () => {
    const { wordToInsert, remaining } = extractNextWord(" hello world");
    expect(wordToInsert).toBe(" hello ");
    expect(remaining).toBe("world");
  });

  it("should handle non-breaking space", () => {
    const nonBreakingSpace = String.fromCharCode(160);
    const completion = `${nonBreakingSpace}hello world`;

    const { wordToInsert, remaining } = extractNextWord(completion);
    expect(wordToInsert).toBe(`${nonBreakingSpace}hello `);
    expect(remaining).toBe("world");
  });

  it("should handle multiple spaces between words", () => {
    const { wordToInsert, remaining } = extractNextWord("hello  world");
    expect(wordToInsert).toBe("hello  ");
    expect(remaining).toBe("world");
  });

  it("should handle punctuation", () => {
    const { wordToInsert, remaining } = extractNextWord("hello, world");
    expect(wordToInsert).toBe("hello, ");
    expect(remaining).toBe("world");
  });
});
