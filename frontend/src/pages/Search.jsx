import { useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Search as SearchIcon, Sparkles, FileText } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { searchAPI } from '../services/api';
import LoadingSpinner from '../components/common/LoadingSpinner';

export default function Search() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [aiSummary, setAiSummary] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    try {
      const { data } = await searchAPI.search(query);
      setResults(data.data.results);
      setAiSummary(data.data.aiSummary);
      if (!data.data.results.length) toast('No results found');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Search failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in max-w-4xl mx-auto pb-16 md:pb-0">
      <div className="text-center">
        <h1 className="text-3xl font-bold flex items-center justify-center gap-3">
          <SearchIcon className="w-8 h-8 text-primary-600" />
          Semantic Search
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-2">
          Search your documents using natural language powered by Pinecone vector search
        </p>
      </div>

      <form onSubmit={handleSearch} className="card">
        <div className="flex gap-3">
          <input
            className="input-field flex-1 text-lg"
            placeholder="e.g. invoices over $500 from last quarter..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button type="submit" className="btn-primary px-6" disabled={loading}>
            {loading ? <LoadingSpinner size="sm" /> : 'Search'}
          </button>
        </div>
        <div className="flex flex-wrap gap-2 mt-4">
          {['financial reports', 'resume skills', 'contract terms', 'invoice amounts'].map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setQuery(s)}
              className="text-xs px-3 py-1 rounded-full bg-gray-100 dark:bg-gray-800 hover:bg-primary-100 dark:hover:bg-primary-900/30"
            >
              {s}
            </button>
          ))}
        </div>
      </form>

      {aiSummary && (
        <div className="card border-primary-200 dark:border-primary-800 bg-primary-50/50 dark:bg-primary-900/10">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-5 h-5 text-primary-600" />
            <h3 className="font-semibold">AI Summary</h3>
          </div>
          <ReactMarkdown className="prose prose-sm dark:prose-invert">{aiSummary}</ReactMarkdown>
        </div>
      )}

      {loading && (
        <div className="flex justify-center py-12">
          <LoadingSpinner text="Searching documents..." />
        </div>
      )}

      {results.length > 0 && (
        <div className="space-y-4">
          <p className="text-sm text-gray-500">{results.length} results found</p>
          {results.map((result, i) => (
            <div key={i} className="card hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3 min-w-0">
                  <FileText className="w-5 h-5 text-primary-600 shrink-0 mt-0.5" />
                  <div className="min-w-0">
                    <Link
                      to={`/insights?id=${result.documentId}`}
                      className="font-semibold hover:text-primary-600 truncate block"
                    >
                      {result.filename}
                    </Link>
                    <div className="flex gap-2 mt-1">
                      <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 capitalize">
                        {result.category}
                      </span>
                      <span className="text-xs text-gray-400">
                        Score: {(result.score * 100).toFixed(0)}%
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 line-clamp-3">
                      {result.snippet}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
