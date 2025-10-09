export type GeminiResponse = {
  isContentPage: boolean;
  content: string;
  chapter: number;
  pageNumber: number;
};

export interface ExtendedGeminiResponse extends GeminiResponse {
  pageId: string;
  pageIndex: number;
}
