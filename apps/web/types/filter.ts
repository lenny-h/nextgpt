import { ArtifactKind } from "./artifact-kind";

export interface FrontendFilter {
  bucketId: string;
  courses: {
    id: string;
    name: string;
  }[];
  files: {
    id: string;
    name: string;
    chapters?: Set<number>;
  }[];
  documents: {
    id: string;
    title: string;
    kind: ArtifactKind;
  }[];
}
