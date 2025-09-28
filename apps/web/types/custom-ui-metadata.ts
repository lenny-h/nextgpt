import * as z from "zod";

import { metadataSchema } from "@/schemas/metadata-schema";

export type MyUIMetadata = z.infer<typeof metadataSchema>;
