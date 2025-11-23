export type WebSource =
  | {
      url: string;
      title?: string;
      description?: string;
      category?: string;
    }
  | {
      markdown?: string;
      html?: string;
      rawHtml?: string;
      json?: unknown;
      summary?: string;
      metadata?: object;
      links?: string[];
      images?: string[];
      screenshot?: string;
      attributes?: Array<{
        selector: string;
        attribute: string;
        values: string[];
      }>;
      actions?: Record<string, unknown>;
      warning?: string;
      changeTracking?: Record<string, unknown>;
    };

/**
 * Normalized web source format for consistent representation
 * across the application (model context and frontend display)
 */
export interface NormalizedWebSource {
  id: string;
  url?: string;
  title: string;
  description?: string;
  /** Full content for model context (markdown, html, or summary) */
  content?: string;
}
