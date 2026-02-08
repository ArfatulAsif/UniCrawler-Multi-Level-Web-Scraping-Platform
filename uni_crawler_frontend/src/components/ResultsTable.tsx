// src/components/ResultsTable.tsx
import React from 'react';
import { ExternalLink, FileText, Calendar } from 'lucide-react';
import type { CrawlResult } from '../types';

export const ResultsTable: React.FC<{ results: CrawlResult[] }> = ({ results }) => {
  if (results.length === 0) return (
    <div className="text-center py-12 text-gray-400 bg-gray-50 rounded-xl border border-dashed border-gray-200">
      Waiting for data stream...
    </div>
  );

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden shadow-sm bg-white">
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-gray-50 text-gray-500 text-xs font-semibold uppercase tracking-wider border-b border-gray-200">
            <tr>
              <th className="px-6 py-3">Source URL</th>
              <th className="px-6 py-3">Intelligence Context</th>
              <th className="px-6 py-3 w-32">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {results.map((res, i) => (
              <tr key={i} className="hover:bg-blue-50/50 transition-colors animate-slide-in">
                <td className="px-6 py-4 align-top">
                  <div className="font-medium text-gray-900 line-clamp-1">{res.title || 'Untitled Document'}</div>
                  <div className="text-xs text-blue-500 mt-1 truncate max-w-[250px] font-mono bg-blue-50 inline-block px-1.5 py-0.5 rounded">
                    {res.url}
                  </div>
                </td>
                <td className="px-6 py-4 align-top">
                  <div className="flex items-start gap-2">
                    <FileText size={16} className="text-gray-400 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-sm text-gray-600 line-clamp-2 leading-relaxed">
                        {res.snippet}
                      </p>
                      <div className="flex gap-2 mt-2">
                         {res.matched_keywords?.map((k, idx) => (
                           <span key={idx} className="text-[10px] font-bold px-1.5 py-0.5 bg-yellow-100 text-yellow-800 rounded">
                             {k}
                           </span>
                         ))}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 align-top">
                  <a 
                    href={res.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 flex items-center gap-1.5 text-sm font-medium border border-blue-200 px-3 py-1.5 rounded-lg hover:bg-blue-50 transition-colors w-fit"
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
};