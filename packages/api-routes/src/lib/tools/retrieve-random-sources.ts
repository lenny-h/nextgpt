import * as z from "zod";

import { type Tool, tool } from "ai";
import { type PracticeFilter } from "../../schemas/practice-filter-schema.js";
import { retrieveRandomSources } from "../db/queries/pages.js";

export const retrieveRandomDocumentSourcesTool = ({
  filter,
  retrieveContent,
}: {
  filter: PracticeFilter;
  retrieveContent: boolean;
}): Tool =>
  tool({
    description: "Retrieves random document sources",
    inputSchema: z.object({}),
    execute: async ({}) => {
      return await retrieveRandomSources({
        filter,
        retrieveContent,
      });
    },
  });
