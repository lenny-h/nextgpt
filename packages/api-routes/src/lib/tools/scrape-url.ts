import FirecrawlApp from "@mendable/firecrawl-js";
import { tool } from "ai";
import { z } from "zod";
import { createLogger } from "../../utils/logger.js";

const logger = createLogger("scrape-tool");

const firecrawlOptions: { apiUrl?: string; apiKey: string } = {
  apiKey: process.env.FIRECRAWL_API_KEY || "dummy-key",
};
if (process.env.FIRECRAWL_API_URL) {
  firecrawlOptions.apiUrl = process.env.FIRECRAWL_API_URL;
}
const app = new FirecrawlApp(firecrawlOptions);

export const scrapeUrlTool = tool({
  description:
    "Scrape the content of a given URL and return it in markdown format.",
  inputSchema: z.object({
    urlToScrape: z
      .url()
      .min(1)
      .max(100)
      .describe("The URL to scrape (including https://)"),
  }),
  execute: async ({ urlToScrape }) => {
    logger.debug("Scraping URL:", urlToScrape);

    try {
      const scrapeResponse = await app.scrape(urlToScrape, {
        formats: ["markdown"],
      });

      logger.debug("Successfully scraped URL:", urlToScrape);
      return scrapeResponse.markdown;
    } catch (error) {
      logger.error("Failed to scrape URL:", urlToScrape, error);
      throw error;
    }
  },
});
