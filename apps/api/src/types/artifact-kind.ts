import * as z from "zod";

export const artifactKindSchema = z.enum(["text", "code"]);

export type ArtifactKind = z.infer<typeof artifactKindSchema>;
