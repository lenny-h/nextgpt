import { type ArtifactKind } from "./artifact-kind.js";
import { type DocumentSource } from "./document-source.js";
import { type WebSource } from "./web-source.js";

export type MyUITools = {
  retrieveDocumentSources: {
    input: {
      keywords: string[];
      questions: string[];
      pageNumbers: number[];
    };
    output: { docSources: DocumentSource[] };
  };
  retrieveWebSources: {
    input: { searchTerms: string[] };
    output: { webSources: WebSource[] };
  };
  retrieveWebPages: {
    input: { urls: string[] };
    output: { webSources: WebSource[] };
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
