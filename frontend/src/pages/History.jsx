import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import { History as HistoryIcon, Search, Filter } from 'lucide-react';
import { fetchHistory } from '../store/slices/documentSlice';
import { documentAPI } from '../services/api';
import DocumentCard from '../components/documents/DocumentCard';
import LoadingSpinner from '../components/common/LoadingSpinner';

export default function History() {
  const dispatch = useDispatch();
  const { documents, pagination, loading } = useSelector((state) => state.documents);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [page, setPage] = useState(1);

  const loadHistory = () => {
    dispatch(fetchHistory({ page, limit: 12, search, category }));
  };

  useEffect(() => {
    loadHistory();
  }, [dispatch, page, category]);

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    loadHistory();
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this document?')) return;
    try {
      await documentAPI.deleteDocument(id);
      toast.success('Document deleted');
      loadHistory();
    } catch {
      toast.error('Delete failed');
    }
  };

  const handleExport = async (id) => {
    try {
      const { data } = await documentAPI.exportReport(id, 'txt');
      const url = URL.createObjectURL(new Blob([data], { type: 'text/plain' }));
      const a = document.createElement('a');
      a.href = url;
      a.download = 'report.txt';
      a.click();
      toast.success('Report exported');
    } catch {
      toast.error('Export failed');
    }
  };

  return (
    <div className="space-y-8 animate-fade-in pb-16 md:pb-0">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <HistoryIcon className="w-8 h-8 text-primary-600" />
          Document History
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          Revisit and manage previously analyzed documents
        </p>
      </div>

      <div className="card">
        <form onSubmit={handleSearch} className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              className="input-field pl-10"
              placeholder="Search documents..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <select
              className="input-field pl-9 pr-8"
              value={category}
              onChange={(e) => { setCategory(e.target.value); setPage(1); }}
            >
              <option value="">All categories</option>
              {['general', 'invoice', 'resume', 'contract', 'report', 'data', 'notes'].map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <button type="submit" className="btn-primary">Search</button>
        </form>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <LoadingSpinner text="Loading documents..." />
        </div>
      ) : documents.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <HistoryIcon className="w-16 h-16 mx-auto mb-4 opacity-30" />
          <p>No documents found</p>
        </div>
      ) : (
        <>
          <div className="grid sm:grid-cols-2 gap-4">
            {documents.map((doc) => (
              <DocumentCard
                key={doc._id}
                document={doc}
                onDelete={handleDelete}
                onExport={handleExport}
              />
            ))}
          </div>
          {pagination && pagination.pages > 1 && (
            <div className="flex justify-center gap-2">
              <button
                className="btn-secondary"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                Previous
              </button>
              <span className="flex items-center text-sm text-gray-500">
                Page {page} of {pagination.pages}
              </span>
              <button
                className="btn-secondary"
                disabled={page >= pagination.pages}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
