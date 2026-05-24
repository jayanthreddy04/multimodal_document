import { useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Bar, Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Tooltip,
  Legend,
} from 'chart.js';
import {
  Lightbulb, ListChecks, Users, TrendingUp, Tag, AlertCircle, Download,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { fetchDocument, fetchHistory } from '../store/slices/documentSlice';
import { documentAPI } from '../services/api';
import LoadingSpinner from '../components/common/LoadingSpinner';

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend);

const SENTIMENT_COLORS = {
  positive: '#22c55e',
  negative: '#ef4444',
  neutral: '#6b7280',
  mixed: '#f59e0b',
};

export default function Insights() {
  const [searchParams] = useSearchParams();
  const docId = searchParams.get('id');
  const dispatch = useDispatch();
  const { currentDocument, documents, loading } = useSelector((state) => state.documents);

  const doc = currentDocument || documents.find((d) => d._id === docId);
  const insights = doc?.insights;

  useEffect(() => {
    if (docId) dispatch(fetchDocument(docId));
    else dispatch(fetchHistory({ status: 'analyzed', limit: 20 }));
  }, [dispatch, docId]);

  const handleExport = async (id) => {
    try {
      const { data } = await documentAPI.exportReport(id, 'txt');
      const url = URL.createObjectURL(new Blob([data], { type: 'text/plain' }));
      const a = document.createElement('a');
      a.href = url;
      a.download = 'document-report.txt';
      a.click();
      toast.success('Report downloaded');
    } catch {
      toast.error('Export failed');
    }
  };

  const categoryData = documents.reduce((acc, d) => {
    const cat = d.category || 'general';
    acc[cat] = (acc[cat] || 0) + 1;
    return acc;
  }, {});

  const barChartData = {
    labels: Object.keys(categoryData),
    datasets: [{
      label: 'Documents',
      data: Object.values(categoryData),
      backgroundColor: '#6366f1',
      borderRadius: 6,
    }],
  };

  const sentimentCounts = documents.reduce((acc, d) => {
    const s = d.insights?.sentiment;
    if (s) acc[s] = (acc[s] || 0) + 1;
    return acc;
  }, {});

  const pieChartData = {
    labels: Object.keys(sentimentCounts),
    datasets: [{
      data: Object.values(sentimentCounts),
      backgroundColor: Object.keys(sentimentCounts).map((s) => SENTIMENT_COLORS[s] || '#6366f1'),
    }],
  };

  if (loading) return <LoadingSpinner text="Loading insights..." />;

  if (!doc && !documents.length) {
    return (
      <div className="text-center py-20 text-gray-400">
        <Lightbulb className="w-16 h-16 mx-auto mb-4 opacity-30" />
        <p>No analyzed documents yet. Upload and analyze a document first.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in pb-16 md:pb-0">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Insights Dashboard</h1>
          {doc && <p className="text-gray-500 mt-1">{doc.originalName}</p>}
        </div>
        {doc && (
          <button onClick={() => handleExport(doc._id)} className="btn-secondary flex items-center gap-2">
            <Download className="w-4 h-4" /> Export Report
          </button>
        )}
      </div>

      {!docId && documents.length > 0 && (
        <div className="grid sm:grid-cols-2 gap-6">
          <div className="card">
            <h3 className="font-semibold mb-4">Documents by Category</h3>
            <Bar data={barChartData} options={{ responsive: true, plugins: { legend: { display: false } } }} />
          </div>
          <div className="card">
            <h3 className="font-semibold mb-4">Sentiment Distribution</h3>
            {Object.keys(sentimentCounts).length > 0 ? (
              <Pie data={pieChartData} options={{ responsive: true }} />
            ) : (
              <p className="text-gray-400 text-sm">No sentiment data yet</p>
            )}
          </div>
        </div>
      )}

      {insights && (
        <>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="card flex items-center gap-3">
              <TrendingUp className="w-8 h-8 text-primary-600" />
              <div>
                <p className="text-sm text-gray-500">Confidence</p>
                <p className="text-2xl font-bold">{insights.confidence || 0}%</p>
              </div>
            </div>
            <div className="card flex items-center gap-3">
              <Tag className="w-8 h-8 text-purple-600" />
              <div>
                <p className="text-sm text-gray-500">Category</p>
                <p className="text-2xl font-bold capitalize">{doc.category}</p>
              </div>
            </div>
            <div className="card flex items-center gap-3">
              <AlertCircle className="w-8 h-8" style={{ color: SENTIMENT_COLORS[insights.sentiment] }} />
              <div>
                <p className="text-sm text-gray-500">Sentiment</p>
                <p className="text-2xl font-bold capitalize">{insights.sentiment}</p>
              </div>
            </div>
            <div className="card flex items-center gap-3">
              <Users className="w-8 h-8 text-cyan-600" />
              <div>
                <p className="text-sm text-gray-500">Entities</p>
                <p className="text-2xl font-bold">{insights.entities?.length || 0}</p>
              </div>
            </div>
          </div>

          <div className="card">
            <h3 className="font-semibold flex items-center gap-2 mb-3">
              <Lightbulb className="w-5 h-5 text-yellow-500" /> Summary
            </h3>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
              {insights.summary}
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            <div className="card">
              <h3 className="font-semibold flex items-center gap-2 mb-4">
                <Lightbulb className="w-5 h-5 text-primary-500" /> Key Insights
              </h3>
              <ul className="space-y-2">
                {(insights.keyInsights || []).map((item, i) => (
                  <li key={i} className="flex gap-2 text-sm">
                    <span className="text-primary-600 font-bold shrink-0">{i + 1}.</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="card">
              <h3 className="font-semibold flex items-center gap-2 mb-4">
                <ListChecks className="w-5 h-5 text-green-500" /> Action Items
              </h3>
              <ul className="space-y-2">
                {(insights.actionItems || []).map((item, i) => (
                  <li key={i} className="flex gap-2 text-sm">
                    <input type="checkbox" className="mt-1 rounded" readOnly />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {insights.highlights?.length > 0 && (
            <div className="card">
              <h3 className="font-semibold mb-4">Highlighted Sections</h3>
              <div className="space-y-3">
                {insights.highlights.map((h, i) => (
                  <blockquote
                    key={i}
                    className="border-l-4 border-primary-500 pl-4 py-2 bg-primary-50 dark:bg-primary-900/20 rounded-r-lg text-sm italic"
                  >
                    {h}
                  </blockquote>
                ))}
              </div>
            </div>
          )}

          {insights.entities?.length > 0 && (
            <div className="card">
              <h3 className="font-semibold mb-3">Important Entities</h3>
              <div className="flex flex-wrap gap-2">
                {insights.entities.map((e, i) => (
                  <span key={i} className="px-3 py-1 rounded-full bg-gray-100 dark:bg-gray-800 text-sm">
                    {e}
                  </span>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {!docId && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Recent Documents</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {documents.filter((d) => d.status === 'analyzed').slice(0, 6).map((d) => (
              <Link
                key={d._id}
                to={`/insights?id=${d._id}`}
                className="card hover:shadow-md transition-shadow block"
              >
                <h4 className="font-medium truncate">{d.originalName}</h4>
                <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                  {d.insights?.summary || 'No summary'}
                </p>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
