import { Bot, ShieldCheck, Terminal, Globe } from 'lucide-react'; // Added Globe icon
import { CrawlForm } from './components/CrawlForm';
import { ResultsTable } from './components/ResultsTable';
import { StatusBadge } from './components/StatusBadge';
import { useCrawler } from './hooks/useCrawler';

function App() {
  // 1. Destructure pagesVisited and stopCrawl
  const { results, status, activeUrls, pagesVisited, startCrawl, stopCrawl } = useCrawler();

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
        
        {/* Info Bar */}
        <div className="mb-6 flex items-center justify-between text-sm text-gray-500 bg-white p-3 rounded-lg border border-gray-200 shadow-sm">
          <span className="flex items-center gap-2">
            <Globe size={16} className="text-blue-500" /> 
            Pages Visited: <strong className="text-gray-900">{pagesVisited}</strong>
          </span>
          <span className="flex items-center gap-2">
            <ShieldCheck size={16} className="text-green-600" /> 
            Results Found: <strong className="text-gray-900">{results.length}</strong>
          </span>
        </div>

        {/* Thread Visualizer */}
        {status === 'scanning' && (
          <div className="mb-6 bg-gray-900 rounded-lg p-3 font-mono text-xs shadow-inner animate-slide-in">
            <div className="flex items-center gap-2 mb-2 text-gray-400 border-b border-gray-800 pb-1">
              <Terminal size={14} />
              <span>Active Threads (5)</span>
            </div>
            <div className="space-y-1">
              {activeUrls.map((url, index) => (
                <div 
                  key={index} 
                  className="flex items-center gap-3 overflow-hidden" 
                  style={{ opacity: 1 - (index * 0.3) }} 
                >
                  <span className="text-green-500">▶</span>
                  <span className="text-green-100 truncate">{url}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <CrawlForm 
          onStart={startCrawl} 
          onStop={stopCrawl} // Pass the stop function
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