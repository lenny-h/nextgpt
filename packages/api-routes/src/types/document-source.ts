import * as z from "zod";
import { documentSourceSchema } from "../schemas/document-source-schema.js";

export type DocumentSource = z.infer<typeof documentSourceSchema>;
