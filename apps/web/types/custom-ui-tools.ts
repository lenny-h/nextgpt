import { ArtifactKind } from "./artifact-kind";
import { DocumentSource } from "./document-source";
import { WebSource } from "./web-source";

export type MyUITools = {
  retrieveDocumentSources: {
    input: {
      keywords: string[];
      questions: string[];
      pageNumbers: number[];
    };
    output: { documentSources: DocumentSource[] };
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
