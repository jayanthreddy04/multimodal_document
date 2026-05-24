import { Link } from 'react-router-dom';
import {
  FileText, Image, File, Trash2, Download, AlertTriangle,
  CheckCircle, Clock, Loader2,
} from 'lucide-react';

const statusConfig = {
  uploaded: { icon: Clock, color: 'text-yellow-500', label: 'Uploaded' },
  processing: { icon: Loader2, color: 'text-blue-500 animate-spin', label: 'Processing' },
  analyzed: { icon: CheckCircle, color: 'text-green-500', label: 'Analyzed' },
  failed: { icon: AlertTriangle, color: 'text-red-500', label: 'Failed' },
};

const categoryColors = {
  invoice: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  resume: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  contract: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
  report: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
  data: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-300',
  notes: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
  general: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
};

export default function DocumentCard({ document, onDelete, onExport }) {
  const status = statusConfig[document.status] || statusConfig.uploaded;
  const StatusIcon = status.icon;
  const FileIcon = document.fileType === 'image' ? Image : FileText;

  return (
    <div className="card hover:shadow-md transition-shadow animate-fade-in group">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <div className="p-2.5 bg-primary-100 dark:bg-primary-900/30 rounded-lg shrink-0">
            <FileIcon className="w-6 h-6 text-primary-600" />
          </div>
          <div className="min-w-0">
            <h3 className="font-semibold truncate">{document.originalName}</h3>
            <div className="flex flex-wrap items-center gap-2 mt-1">
              <span className={`text-xs px-2 py-0.5 rounded-full ${categoryColors[document.category] || categoryColors.general}`}>
                {document.category}
              </span>
              <span className="flex items-center gap-1 text-xs text-gray-500">
                <StatusIcon className={`w-3.5 h-3.5 ${status.color}`} />
                {status.label}
              </span>
              {document.isDuplicate && (
                <span className="text-xs text-amber-600 dark:text-amber-400">Duplicate</span>
              )}
            </div>
            {document.insights?.summary && (
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 line-clamp-2">
                {document.insights.summary}
              </p>
            )}
            {document.insights?.confidence > 0 && (
              <div className="mt-2 flex items-center gap-2">
                <div className="flex-1 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full max-w-[120px]">
                  <div
                    className="h-full bg-primary-500 rounded-full"
                    style={{ width: `${document.insights.confidence}%` }}
                  />
                </div>
                <span className="text-xs text-gray-500">{document.insights.confidence}% confidence</span>
              </div>
            )}
          </div>
        </div>
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
          {document.status === 'analyzed' && (
            <>
              <Link
                to={`/insights?id=${document._id}`}
                className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
                title="View insights"
              >
                <File className="w-4 h-4" />
              </Link>
              <button
                onClick={() => onExport?.(document._id)}
                className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
                title="Export report"
              >
                <Download className="w-4 h-4" />
              </button>
            </>
          )}
          <button
            onClick={() => onDelete?.(document._id)}
            className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500"
            title="Delete"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
      <p className="text-xs text-gray-400 mt-3">
        {new Date(document.createdAt).toLocaleString()}
      </p>
    </div>
  );
}
