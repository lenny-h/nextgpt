import { vertex } from "@ai-sdk/google-vertex";
import {
  matchDocuments,
  retrievePagesByPageNumbers,
  searchPagesByContent,
} from "../lib/db/queries/pages.js";
import { type Filter } from "../schemas/filter-schema.js";
import { type PracticeFilter } from "../schemas/practice-filter-schema.js";
import { type DocumentSource } from "../types/document-source.js";

export async function retrieveEmbedding(text: string): Promise<number[]> {
  const { embeddings } = await vertex
    .textEmbeddingModel("text-embedding-004")
    .doEmbed({ values: [text] });

  if (!embeddings || embeddings.length === 0) {
    throw new Error("Failed to generate embedding");
  }

  return embeddings[0];
}

export async function retrieveDocumentSources({
  filter,
  retrieveContent,
  embedding,
  ftsQuery,
  pageNumbers,
  matchThreshold = 0.4,
}: {
  filter: Filter | PracticeFilter;
  retrieveContent: boolean;
  embedding?: number[];
  ftsQuery?: string;
  pageNumbers?: number[];
  chapter?: number;
  matchThreshold?: number;
}): Promise<{ documentSources: DocumentSource[] }> {
  const queries = [];

  if (embedding) {
    queries.push(
      matchDocuments({
        queryEmbedding: embedding,
        filter,
        retrieveContent,
        matchThreshold,
        matchCount: 4,
      })
    );
  }

  if (ftsQuery?.trim()) {
    queries.push(
      searchPagesByContent({
        searchQuery: ftsQuery,
        filter,
        retrieveContent,
        limit: 4,
      })
    );
  }

  if (pageNumbers && pageNumbers.length > 0) {
    queries.push(
      retrievePagesByPageNumbers({ pageNumbers, filter, retrieveContent })
    );
  }

  const results = await Promise.all(queries);
  const uniqueResultsMap = new Map<string, DocumentSource>();

  for (const resultSet of results) {
    for (const doc of resultSet) {
      if (!uniqueResultsMap.has(doc.id)) {
        uniqueResultsMap.set(doc.id, doc);
      }
    }
  }

  return { documentSources: Array.from(uniqueResultsMap.values()) };
}
