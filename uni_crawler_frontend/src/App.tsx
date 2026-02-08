// src/App.tsx
import { Bot, ShieldCheck } from 'lucide-react';
import { CrawlForm } from './components/CrawlForm';
import { ResultsTable } from './components/ResultsTable';
import { StatusBadge } from './components/StatusBadge';
import { useCrawler } from './hooks/useCrawler';

function App() {
  const { results, status, startCrawl } = useCrawler();

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans pb-20">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-600 rounded-lg text-white shadow-lg">
              <Bot size={24} />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-gray-900">UniCrawler <span className="text-blue-600">High-End</span></h1>
              <p className="text-xs text-gray-500 font-medium">Distributed Intelligence Engine</p>
            </div>
          </div>
          <StatusBadge status={status} />
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-3xl mx-auto px-4 mt-8">
        
        {/* Connection Info */}
        <div className="mb-6 flex items-center justify-between text-sm text-gray-500">
          <span className="flex items-center gap-1.5">
            <ShieldCheck size={16} className="text-green-600" /> Secure Connection
          </span>
          <span>
            Results found: <strong className="text-gray-900">{results.length}</strong>
          </span>
        </div>

        <CrawlForm 
          onStart={startCrawl} 
          isLoading={status === 'connecting' || status === 'scanning'} 
        />

        <div className="flex items-center gap-4 mb-4">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Live Feed</h2>
          <div className="h-px bg-gray-200 flex-1"></div>
        </div>

        <ResultsTable results={results} />
      </main>
    </div>
  );
}

export default App;