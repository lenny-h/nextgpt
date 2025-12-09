import FirecrawlApp from "@mendable/firecrawl-js";
import { type SearchWebOutput } from "@workspace/api-routes/types/tool-output.js";
import {
  type NormalizedWebSource,
  type WebSource,
} from "@workspace/api-routes/types/web-source.js";
import { generateUUID } from "@workspace/api-routes/utils/utils.js";
import { createLogger } from "@workspace/server/logger.js";
import { tool } from "ai";
import { z } from "zod";

const logger = createLogger("search-tool");

const firecrawlOptions: { apiUrl?: string; apiKey: string } = {
  apiKey: process.env.FIRECRAWL_API_KEY || "dummy-key",
};
if (process.env.FIRECRAWL_API_URL) {
  firecrawlOptions.apiUrl = process.env.FIRECRAWL_API_URL;
}
const app = new FirecrawlApp(firecrawlOptions);

/**
 * Normalizes a WebSource from Firecrawl into a consistent format
 * that works for both the model context and frontend display
 */
function normalizeWebSource(
  source: WebSource,
  index: number
): NormalizedWebSource {
  const id = generateUUID();

  // Handle URL-based source (first union type)
  if ("url" in source) {
    return {
      id,
      url: source.url,
      title: source.title || source.url,
      description: source.description,
    };
  }

  // Handle content-based source (second union type)
  // Extract the most relevant content for the model
  const content = source.markdown || source.html || source.summary;

  return {
    id,
    title: `Web Source ${index + 1}`,
    description: source.summary,
    content,
  };
}

export const createSearchWebTool = ({
  storeFullContent,
}: {
  storeFullContent: (id: string, content: SearchWebOutput) => void;
}) =>
  tool({
    description: "Retrieves web sources based on a search query.",
    inputSchema: z.object({
      searchTerms: z
        .string()
        .min(1)
        .max(100)
        .describe("The search query to use"),
    }),
    execute: async ({ searchTerms }, { toolCallId }) => {
      logger.debug("Searching web for query:", searchTerms);

      try {
        const searchResponse = await app.search(searchTerms, {
          limit: 6,
          scrapeOptions: {
            formats: ["markdown"],
          },
        });

        logger.debug("Search completed successfully:", {
          query: searchTerms,
          resultsCount: searchResponse.web?.length || 0,
        });

        // Normalize all web sources into a consistent format
        const normalizedSources = (searchResponse.web || []).map(
          (source, index) => normalizeWebSource(source, index)
        );

        const fullResult: SearchWebOutput = { webSources: normalizedSources };

        // Store the full content for the model context
        storeFullContent(toolCallId, fullResult);

        // Return truncated content for the client/DB
        const truncatedWebSources = fullResult.webSources.map((source) => ({
          ...source,
          content: source.content?.slice(0, 20) + "...",
        }));

        return { webSources: truncatedWebSources };
      } catch (error) {
        logger.error("Search failed for query:", searchTerms, error);
        throw error;
      }
    },
  });
