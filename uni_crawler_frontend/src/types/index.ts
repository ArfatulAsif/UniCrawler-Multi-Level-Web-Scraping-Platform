export interface CrawlResult {
  url: string;
  title: string;
  snippet: string;
  matched_keywords: string[];
  score: number; // <--- NEW: The relevance score
  timestamp: string;
}

export type ConnectionStatus = 'idle' | 'connecting' | 'scanning' | 'complete' | 'error';

export interface CrawlFormData {
  url: string;
  keywords: string;
  depth: number; // <--- NEW: The BFS Level
}