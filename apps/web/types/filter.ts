import { type ArtifactKind } from "@workspace/api-routes/types/artifact-kind";

export interface FrontendFilter {
  bucket: {
    id: string;
  };
  courses: {
    id: string;
    name: string;
  }[];
  files: {
    id: string;
    name: string;
    pageCount: number;
    pageRange?: string;
  }[];
  documents: {
    id: string;
    title: string;
    kind: ArtifactKind;
  }[];
  prompts: {
    id: string;
    name: string;
    content: string;
  }[];
}
