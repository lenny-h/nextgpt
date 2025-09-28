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
  label: string;
}[] = [
  { id: "facts", label: "Hard facts" },
  { id: "concepts", label: "Test understanding of concepts" },
  { id: "application", label: "Apply knowledge to problems" },
  { id: "multipleChoice", label: "Multiple choice questions" },
];
