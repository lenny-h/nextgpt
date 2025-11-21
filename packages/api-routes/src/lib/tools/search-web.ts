import FirecrawlApp from "@mendable/firecrawl-js";
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

export const searchWebTool = tool({
  description: "Search the web for relevant information based on a user query.",
  inputSchema: z.object({
    searchTerms: z.string().min(1).max(100).describe("The search query to use"),
  }),
  execute: async ({ searchTerms }) => {
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
      return searchResponse.web || [];
    } catch (error) {
      logger.error("Search failed for query:", searchTerms, error);
      throw error;
    }
  },
});
