import FirecrawlApp from "@mendable/firecrawl-js";
import { tool } from "ai";
import { z } from "zod";
import { createLogger } from "../../utils/logger.js";

const logger = createLogger("scrape-tool");

const app = new FirecrawlApp({
  apiUrl: process.env.FIRECRAWL_API_URL,
  apiKey: process.env.FIRECRAWL_API_KEY || "dummy-key",
});

export const scrapeTool = tool({
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
