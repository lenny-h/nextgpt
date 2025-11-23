import { type DocumentSource } from "./document-source.js";
import { type NormalizedWebSource } from "./web-source.js";

export interface SearchWebOutput {
    webSources: NormalizedWebSource[];
}


export interface ScrapeUrlOutput {
    markdown: string;
}

export interface SearchDocumentsOutput {
    docSources: DocumentSource[];
}

export type ToolOutput =
    | SearchWebOutput
    | ScrapeUrlOutput
    | SearchDocumentsOutput;
