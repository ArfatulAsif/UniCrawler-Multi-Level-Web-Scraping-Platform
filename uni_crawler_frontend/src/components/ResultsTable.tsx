// src/components/ResultsTable.tsx
import React from 'react';
import { ExternalLink, Clock, Zap } from 'lucide-react'; 
import type { CrawlResult } from '../types';

interface ResultsTableProps {
  results: CrawlResult[];
}

export function ResultsTable({ results }: ResultsTableProps) {
  if (results.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-xl border border-gray-200 border-dashed">
        <p className="text-gray-500">No intelligence data gathered yet.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 font-semibold text-gray-900 w-24">Score</th>
              <th className="px-6 py-3 font-semibold text-gray-900">Found Content</th>
              <th className="px-6 py-3 font-semibold text-gray-900 w-32 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {results.map((result, index) => (
              <tr key={index} className="hover:bg-gray-50 transition-colors group">
                
                {/* 1. SCORE COLUMN */}
                <td className="px-6 py-4 whitespace-nowrap align-top">
                  <div className={`
                    inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium
                    ${result.score >= 40 ? 'bg-green-100 text-green-800' : 
                      result.score >= 20 ? 'bg-yellow-100 text-yellow-800' : 
                      'bg-gray-100 text-gray-800'}
                  `}>
                    <Zap size={12} />
                    {result.score.toFixed(1)}
                  </div>
                  <div className="mt-1 text-xs text-gray-400 flex items-center gap-1">
                    <Clock size={10} />
                    {result.timestamp}
                  </div>
                </td>

                {/* 2. CONTENT COLUMN */}
                <td className="px-6 py-4">
                  <div className="flex flex-col gap-1">
                    <h3 className="font-medium text-gray-900 text-base">{result.title}</h3>
                    <p className="text-gray-600 line-clamp-3 leading-relaxed">
                      {result.snippet}
                    </p>
                    <div className="flex gap-2 mt-2">
                      {result.matched_keywords.map((keyword, k) => (
                        <span key={k} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100">
                          {keyword}
                        </span>
                      ))}
                    </div>
                  </div>
                </td>
                
                {/* 3. ACTION COLUMN */}
                <td className="px-6 py-4 whitespace-nowrap text-right align-top">
                  <a
                    href={result.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 font-medium opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0"
                  >
                    View <ExternalLink size={14} />
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}