import FirecrawlApp from "@mendable/firecrawl-js";
import { tool } from "ai";
import { z } from "zod";
import { createLogger } from "../../utils/logger.js";

const logger = createLogger("search-tool");

const firecrawlOptions: { apiUrl?: string; apiKey: string } = {
  apiKey: process.env.FIRECRAWL_API_KEY || "dummy-key",
};
if (process.env.FIRECRAWL_API_URL) {
  firecrawlOptions.apiUrl = process.env.FIRECRAWL_API_URL;
}
const app = new FirecrawlApp(firecrawlOptions);

export const searchTool = tool({
  description: "Search the web for relevant information based on a user query.",
  inputSchema: z.object({
    searchQuery: z.string().min(1).max(100).describe("The search query to use"),
  }),
  execute: async ({ searchQuery }) => {
    logger.debug("Searching web for query:", searchQuery);

    try {
      const searchResponse = await app.search(searchQuery, {
        limit: 6,
        scrapeOptions: {
          formats: ["markdown"],
        },
      });

      logger.debug("Search completed successfully:", {
        query: searchQuery,
        resultsCount: searchResponse.web?.length || 0,
      });
      return searchResponse.web;
    } catch (error) {
      logger.error("Search failed for query:", searchQuery, error);
      throw error;
    }
  },
});
