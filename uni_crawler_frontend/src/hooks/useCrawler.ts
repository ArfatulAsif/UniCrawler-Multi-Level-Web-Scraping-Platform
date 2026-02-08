// src/hooks/useCrawler.ts
import { useState, useRef, useCallback } from 'react';
import axios from 'axios';
import type { CrawlResult, ConnectionStatus } from '../types';

const API_URL = 'http://localhost:8000'; // Backend URL







export const useCrawler = () => {
  const [results, setResults] = useState<CrawlResult[]>([]);
  const [status, setStatus] = useState<ConnectionStatus>('idle');
  const socketRef = useRef<WebSocket | null>(null);

  const startCrawl = async (url: string, keywords: string[]) => {
    // Reset state for new crawl
    setResults([]);
    setStatus('connecting');

    try {
      // 1. Send Command to Backend
      const response = await axios.post(`${API_URL}/api/crawl`, {
        url,
        keywords
      });

      const jobId = response.data.job_id;
      
      // 2. Open Real-Time Stream
      const ws = new WebSocket(`ws://localhost:8000/api/stream/${jobId}`);
      socketRef.current = ws;

      ws.onopen = () => {
        setStatus('scanning');
        console.log('Connected to Intelligence Stream');
      };

      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        // HIGH END FEATURE: Add new row to the TOP immediately
        setResults((prev) => [data, ...prev]);
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

  const stopCrawl = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.close();
      setStatus('idle');
    }
  }, [status]);

  return { results, status, startCrawl, stopCrawl };
};