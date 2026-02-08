export interface CrawlResult {
  url: string;
  title: string;
  snippet: string;
  matched_keywords: string[];
  timestamp: string;
}

export type ConnectionStatus = 'idle' | 'connecting' | 'scanning' | 'complete' | 'error';