import { useState, useRef, useCallback } from 'react';
import axios from 'axios';
import type { CrawlResult, ConnectionStatus } from '../types';

const API_URL = 'http://localhost:8000'; 

export const useCrawler = () => {
  const [results, setResults] = useState<CrawlResult[]>([]);
  const [status, setStatus] = useState<ConnectionStatus>('idle');
  const [activeUrls, setActiveUrls] = useState<string[]>([]); 
  
  // NEW: Counter for pages visited
  const [pagesVisited, setPagesVisited] = useState<number>(0);

  const socketRef = useRef<WebSocket | null>(null);

  const startCrawl = async (url: string, keywords: string[], depth: number) => {
    setResults([]);
    setActiveUrls([]); 
    setPagesVisited(0); // Reset counter
    setStatus('connecting');

    try {
      const response = await axios.post(`${API_URL}/api/crawl`, {
        url,
        keywords,
        depth 
      });

      const jobId = response.data.job_id;
      
      const ws = new WebSocket(`ws://localhost:8000/api/stream/${jobId}`);
      socketRef.current = ws;

      ws.onopen = () => {
        setStatus('scanning');
      };

      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        
        if (data.type === 'progress') {
            // 1. Increment Page Counter
            setPagesVisited((prev) => prev + 1);

            // 2. Update Visual Feed
            setActiveUrls((prev) => {
                const newList = [data.url, ...prev];
                return newList.slice(0, 3); 
            });
        } else {
            setResults((prev) => [data, ...prev]);
        }
      };

      ws.onerror = (err) => {
        console.error('WebSocket error:', err);
        setStatus('error');
      };

      ws.onclose = () => {
        if (status === 'scanning') {
          setStatus('complete');
        }
      };

    } catch (error) {
      console.error('Failed to start crawl:', error);
      setStatus('error');
    }
  };

  // NEW: Stop function
  const stopCrawl = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.close(); // Cut the connection
      setStatus('idle');
    }
  }, [status]);

  return { results, status, activeUrls, pagesVisited, startCrawl, stopCrawl };
};