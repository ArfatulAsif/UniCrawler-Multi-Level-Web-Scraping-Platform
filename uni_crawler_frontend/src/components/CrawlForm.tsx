import React, { useState } from 'react';
import { Play, Plus, X, Globe, Layers, Square } from 'lucide-react'; // Added Square icon

interface Props {
  onStart: (url: string, keywords: string[], depth: number) => void;
  onStop: () => void; // NEW: Stop Handler
  isLoading: boolean;
}

export const CrawlForm: React.FC<Props> = ({ onStart, onStop, isLoading }) => {
  const [url, setUrl] = useState('');
  const [keywordInput, setKeywordInput] = useState('');
  const [keywords, setKeywords] = useState<string[]>([]);
  const [depth, setDepth] = useState<number>(2); 

  const addKeyword = () => {
    if (keywordInput.trim() && !keywords.includes(keywordInput.trim())) {
      setKeywords([...keywords, keywordInput.trim()]);
      setKeywordInput('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addKeyword();
    }
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mb-8">
      <div className="flex flex-col gap-6">
        
        {/* URL Input */}
        <div>
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">Target University URL</label>
          <div className="relative">
            <Globe className="absolute left-3 top-3 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="https://www.cam.ac.uk"
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all disabled:bg-gray-50 disabled:text-gray-400"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              disabled={isLoading} 
            />
          </div>
        </div>

        {/* Keywords Input */}
        <div>
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">Search Keywords</label>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Add keyword (e.g. Scholarship)..."
              className="flex-1 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all disabled:bg-gray-50 disabled:text-gray-400"
              value={keywordInput}
              onChange={(e) => setKeywordInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isLoading}
            />
            <button 
              onClick={addKeyword}
              disabled={isLoading}
              className="p-2.5 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg transition-colors disabled:opacity-50"
            >
              <Plus size={20} />
            </button>
          </div>
          
          {keywords.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
              {keywords.map((k, i) => (
                <span key={i} className="px-3 py-1 bg-blue-50 text-blue-700 border border-blue-100 rounded-full text-sm font-medium flex items-center gap-1.5 animate-slide-in">
                  {k}
                  <button onClick={() => setKeywords(keywords.filter((_, idx) => idx !== i))} className="hover:text-blue-900" disabled={isLoading}>
                    <X size={14} />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Depth Input */}
        <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block flex items-center gap-2">
                <Layers size={14} />
                Crawl Depth (Level)
            </label>
            <div className="relative">
                <input 
                    type="number" 
                    min="1" 
                    max="5" 
                    value={depth}
                    onChange={(e) => setDepth(parseInt(e.target.value) || 1)}
                    disabled={isLoading}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all disabled:bg-gray-50 disabled:text-gray-400"
                />
            </div>
        </div>

        {/* SWITCH BUTTONS: LAUNCH vs STOP */}
        {isLoading ? (
            <button
              onClick={onStop}
              className="w-full py-3 bg-red-500 text-white rounded-lg font-semibold hover:bg-red-600 flex justify-center items-center gap-2 transition-all shadow-md hover:shadow-lg mt-2"
            >
              <Square size={18} fill="currentColor" /> Stop Crawl
            </button>
        ) : (
            <button
              onClick={() => onStart(url, keywords, depth)}
              disabled={!url || keywords.length === 0}
              className="w-full py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2 transition-all shadow-md hover:shadow-lg mt-2"
            >
              <Play size={18} fill="currentColor" /> Launch Intelligence Crawler
            </button>
        )}

      </div>
    </div>
  );
};