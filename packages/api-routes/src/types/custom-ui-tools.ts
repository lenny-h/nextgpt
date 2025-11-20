import { type ArtifactKind } from "./artifact-kind.js";
import { type DocumentSource } from "./document-source.js";

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
    input: { searchTerms: string };
    output: {
      url: string;
      title?: string;
      description?: string;
      markdown?: string;
    }[];
  };
  scrapeUrl: {
    input: { urlToScrape: string };
    output: string;
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
