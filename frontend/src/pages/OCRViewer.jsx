import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import { ScanText, RefreshCw, Globe } from 'lucide-react';
import { fetchHistory } from '../store/slices/documentSlice';
import { documentAPI } from '../services/api';
import LoadingSpinner from '../components/common/LoadingSpinner';

const LANGUAGES = [
  { code: 'eng', label: 'English' },
  { code: 'spa', label: 'Spanish' },
  { code: 'fra', label: 'French' },
  { code: 'deu', label: 'German' },
  { code: 'hin', label: 'Hindi' },
  { code: 'chi_sim', label: 'Chinese' },
  { code: 'jpn', label: 'Japanese' },
  { code: 'ara', label: 'Arabic' },
];

export default function OCRViewer() {
  const dispatch = useDispatch();
  const { documents, loading } = useSelector((state) => state.documents);
  const [selectedId, setSelectedId] = useState('');
  const [ocrResult, setOcrResult] = useState(null);
  const [language, setLanguage] = useState('eng');
  const [running, setRunning] = useState(false);

  useEffect(() => {
    dispatch(fetchHistory({ limit: 50 }));
  }, [dispatch]);

  const imageDocs = documents.filter(
    (d) => d.fileType === 'image' || d.fileType === 'pdf'
  );

  const runOCR = async () => {
    if (!selectedId) return toast.error('Select a document first');
    setRunning(true);
    try {
      const { data } = await documentAPI.runOCR(selectedId, language);
      setOcrResult(data.data.ocr);
      toast.success('OCR completed');
    } catch (err) {
      toast.error(err.response?.data?.message || 'OCR failed');
    } finally {
      setRunning(false);
    }
  };

  const selectedDoc = documents.find((d) => d._id === selectedId);

  return (
    <div className="space-y-8 animate-fade-in pb-16 md:pb-0">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <ScanText className="w-8 h-8 text-primary-600" />
          OCR Viewer
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          Extract text from scanned documents and images with multilingual support
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="card lg:col-span-1 space-y-4">
          <h3 className="font-semibold">Select Document</h3>
          {loading ? (
            <LoadingSpinner />
          ) : (
            <select
              className="input-field"
              value={selectedId}
              onChange={(e) => setSelectedId(e.target.value)}
            >
              <option value="">Choose a document...</option>
              {imageDocs.map((d) => (
                <option key={d._id} value={d._id}>{d.originalName}</option>
              ))}
            </select>
          )}

          <div>
            <label className="flex items-center gap-2 text-sm font-medium mb-1.5">
              <Globe className="w-4 h-4" /> Language
            </label>
            <select
              className="input-field"
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
            >
              {LANGUAGES.map((l) => (
                <option key={l.code} value={l.code}>{l.label}</option>
              ))}
            </select>
          </div>

          <button
            onClick={runOCR}
            disabled={!selectedId || running}
            className="btn-primary w-full flex items-center justify-center gap-2"
          >
            {running ? <LoadingSpinner size="sm" /> : <><RefreshCw className="w-4 h-4" /> Run OCR</>}
          </button>
        </div>

        <div className="card lg:col-span-2 min-h-[400px]">
          <h3 className="font-semibold mb-4">Extracted Text</h3>
          {ocrResult ? (
            <div className="space-y-4">
              <div className="flex gap-4 text-sm">
                <span className="px-3 py-1 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300">
                  Confidence: {ocrResult.confidence}%
                </span>
                <span className="px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
                  Language: {ocrResult.language}
                </span>
                <span className="px-3 py-1 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600">
                  Words: {ocrResult.wordCount}
                </span>
              </div>
              <pre className="whitespace-pre-wrap text-sm leading-relaxed p-4 bg-gray-50 dark:bg-gray-800 rounded-lg max-h-[500px] overflow-y-auto font-mono">
                {ocrResult.text}
              </pre>
            </div>
          ) : selectedDoc?.ocrText ? (
            <pre className="whitespace-pre-wrap text-sm leading-relaxed p-4 bg-gray-50 dark:bg-gray-800 rounded-lg max-h-[500px] overflow-y-auto font-mono">
              {selectedDoc.ocrText}
            </pre>
          ) : (
            <div className="flex flex-col items-center justify-center h-64 text-gray-400">
              <ScanText className="w-16 h-16 mb-4 opacity-30" />
              <p>Select a document and run OCR to view extracted text</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
