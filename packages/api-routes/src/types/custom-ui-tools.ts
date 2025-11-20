import { type ArtifactKind } from "./artifact-kind.js";
import { type DocumentSource } from "./document-source.js";
import { type WebSource } from "./web-source.js";

export type MyUITools = {
  searchDocuments: {
    input: {
      keywords: string[];
      questions: string[];
      pageNumbers: number[];
    };
    output: { docSources: DocumentSource[] };
  };
  searchWeb: {
    input: { searchTerms: string[] };
    output: { webSources: WebSource[] };
  };
  scrapeUrl: {
    input: { urls: string[] };
    output: { webSources: WebSource[] };
  };
  createDocument: {
    input: {
      instructions: string;
      documentTitle: string;
      kind: ArtifactKind;
    };
    output: {
      message: string;
      documentId: string;
      documentTitle: string;
      kind: ArtifactKind;
    };
  };
  modifyDocument: {
    input: { instructions: string };
    output: {
      message: string;
      documentId: string;
      documentTitle: string;
      kind: ArtifactKind;
    };
  };
  createMultipleChoice: {
    input: {
      question: string;
      choiceA: string;
      choiceB: string;
      choiceC: string;
      choiceD: string;
      correctAnswer: "A" | "B" | "C" | "D";
    };
    output: { message: string };
  };
};
