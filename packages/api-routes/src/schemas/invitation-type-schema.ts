import * as z from "zod";

export const invitationTypeSchema = z.enum([
  "user",
  "course_maintainer",
  "bucket_maintainer",
]);
