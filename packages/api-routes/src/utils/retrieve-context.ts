import { embed } from "ai";
import {
  retrieveChunksByPageNumber,
  searchChunksByFts,
  searchChunksByVs,
} from "../lib/db/queries/chunks.js";
import { getEmbeddingModel } from "../lib/embeddings-providers.js";
import { type Filter } from "../schemas/filter-schema.js";
import { type PracticeFilter } from "../schemas/practice-filter-schema.js";
import { type DocumentSource } from "../types/document-source.js";

export async function retrieveEmbedding(text: string): Promise<number[]> {
  const { model } = await getEmbeddingModel();

  const { embedding } = await embed({
    model,
    value: text,
  });

  if (!embedding) {
    throw new Error("Failed to generate embedding");
  }

  return embedding;
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
}): Promise<DocumentSource[]> {
  const queries = [];

  if (embedding) {
    queries.push(
      searchChunksByVs({
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
      searchChunksByFts({
        searchQuery: ftsQuery,
        filter,
        retrieveContent,
        limit: 4,
      })
    );
  }

  if (pageNumbers && pageNumbers.length > 0) {
    queries.push(
      retrieveChunksByPageNumber({ pageNumbers, filter, retrieveContent })
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

  return Array.from(uniqueResultsMap.values());
}
