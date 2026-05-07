/**
 * Shared code between client and server
 * Useful to share types between client and server
 * and/or small pure JS functions that can be used on both client and server
 */

/**
 * Example response type for /api/demo
 */
export interface SearchResult {
  table: string;
  id: string | number;
  title: string;
  subtitle?: string;
  type: string;
}

export interface SearchResponse {
  results: SearchResult[];
}
