export type DoclingResponse = {
  markdown: string;
  success: boolean;
  message?: string;
};

export type DoclingChunk = {
  content: string;
  chunk_index: number;
};

export type ChunkedDoclingResponse = {
  chunks: DoclingChunk[];
  total_chunks: number;
  success: boolean;
  message?: string;
};
