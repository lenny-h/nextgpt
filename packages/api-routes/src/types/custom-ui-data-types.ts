import { type ArtifactKind } from "./artifact-kind.js";

export type MyUIDataTypes = {
  chat: { id: string };
  kind: { id: string; title: string; kind: ArtifactKind };
  "text-delta": string;
  "code-delta": string;
  finish: string;
};
