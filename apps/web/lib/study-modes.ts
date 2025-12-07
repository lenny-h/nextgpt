import * as z from "zod";

export const studyModeSchema = z.enum([
  "facts",
  "concepts",
  "application",
  "multipleChoice",
]);

export type StudyMode = z.infer<typeof studyModeSchema>;

export const studyModes: {
  id: StudyMode;
}[] = [
  { id: "facts" },
  { id: "concepts" },
  { id: "application" },
  { id: "multipleChoice" },
];
