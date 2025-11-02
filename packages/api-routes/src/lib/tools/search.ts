import FirecrawlApp from "@mendable/firecrawl-js";
import { tool } from "ai";
import { z } from "zod";

const app = new FirecrawlApp({
  apiUrl: process.env.FIRECRAWL_API_URL,
  apiKey: process.env.FIRECRAWL_API_KEY || "dummy-key",
});

export const searchTool = tool({
  description: "Search the web for relevant information based on a user query.",
  inputSchema: z.object({
    searchQuery: z.string().min(1).max(100).describe("The search query to use"),
  }),
  execute: async ({ searchQuery }) => {
    const searchResponse = await app.search(searchQuery, {
      limit: 6,
      scrapeOptions: {
        formats: ["markdown"],
      },
    });

    return searchResponse.web;
  },
});
