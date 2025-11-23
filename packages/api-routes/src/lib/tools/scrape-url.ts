import FirecrawlApp from "@mendable/firecrawl-js";
import { type ScrapeUrlOutput } from "@workspace/api-routes/types/tool-output.js";
import { createLogger } from "@workspace/server/logger.js";
import { tool } from "ai";
import { z } from "zod";

const logger = createLogger("scrape-tool");

const firecrawlOptions: { apiUrl?: string; apiKey: string } = {
  apiKey: process.env.FIRECRAWL_API_KEY || "dummy-key",
};
if (process.env.FIRECRAWL_API_URL) {
  firecrawlOptions.apiUrl = process.env.FIRECRAWL_API_URL;
}
const app = new FirecrawlApp(firecrawlOptions);

export const createScrapeUrlTool = ({
  storeFullContent,
}: {
  storeFullContent: (id: string, content: ScrapeUrlOutput) => void;
}) =>
  tool({
    description:
      "Scrape the content of a given URL and return it in markdown format.",
    inputSchema: z.object({
      urlToScrape: z
        .url()
        .min(1)
        .max(100)
        .describe("The URL to scrape (including https://)"),
    }),
    execute: async ({ urlToScrape }, { toolCallId }) => {
      logger.debug("Scraping URL:", urlToScrape);

      try {
        const scrapeResponse = await app.scrape(urlToScrape, {
          formats: ["markdown"],
        });

        logger.debug("Successfully scraped URL:", urlToScrape);

        const fullResult = { markdown: scrapeResponse.markdown || "" };

        // Store the full content for the model context
        storeFullContent(toolCallId, fullResult);

        // Return truncated content for the client/DB
        return { markdown: fullResult.markdown?.slice(0, 20) + "..." };
      } catch (error) {
        logger.error("Failed to scrape URL:", urlToScrape, error);
        throw error;
      }
    },
  });
