import * as z from "zod";

import { metadataSchema } from "../schemas/metadata-schema.js";

export type MyUIMetadata = z.infer<typeof metadataSchema>;
