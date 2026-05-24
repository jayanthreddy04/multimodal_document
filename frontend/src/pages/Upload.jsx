import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import { Play, X, File } from 'lucide-react';
import FileDropzone from '../components/upload/FileDropzone';
import ProgressBar from '../components/common/ProgressBar';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { documentAPI } from '../services/api';
import { setUploadProgress, setProcessingStage } from '../store/slices/documentSlice';

const STAGE_PROGRESS = {
  queued: 5,
  extracting: 20,
  categorizing: 35,
  analyzing_tables: 45,
  detecting_duplicates: 55,
  ai_analysis: 70,
  indexing: 85,
  complete: 100,
};

export default function Upload() {
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [uploadedDocs, setUploadedDocs] = useState([]);
  const dispatch = useDispatch();
  const { uploadProgress, processingStage } = useSelector((state) => state.documents);

  const handleFiles = (accepted) => {
    setFiles((prev) => [...prev, ...accepted.map((f) => ({ file: f, id: Math.random() }))]);
  };

  const removeFile = (id) => setFiles((prev) => prev.filter((f) => f.id !== id));

  const handleUploadAndAnalyze = async () => {
    if (!files.length) return toast.error('Please select files first');
    setUploading(true);

    try {
      for (const { file } of files) {
        const { data } = await documentAPI.upload(file, (p) => dispatch(setUploadProgress(p)));
        const doc = data.data.document;
        setUploadedDocs((prev) => [...prev, doc]);

        setAnalyzing(true);
        dispatch(setProcessingStage('extracting'));

        const pollStatus = async (docId) => {
          const interval = setInterval(async () => {
            try {
              const statusRes = await documentAPI.getStatus(docId);
              const { status, processingStage: stage } = statusRes.data.data;
              dispatch(setProcessingStage(stage || ''));
              const progress = STAGE_PROGRESS[stage] || (status === 'analyzed' ? 100 : 50);
              dispatch(setUploadProgress(progress));
              if (status === 'analyzed' || status === 'failed') {
                clearInterval(interval);
                setAnalyzing(false);
                if (status === 'analyzed') toast.success(`${file.name} analyzed successfully!`);
                else toast.error(`Analysis failed for ${file.name}`);
              }
            } catch { /* ignore poll errors */ }
          }, 2000);
        };

        try {
          await documentAPI.analyze(doc._id);
          pollStatus(doc._id);
          toast.success(`Uploaded ${file.name} — analyzing...`);
        } catch (analyzeErr) {
          setAnalyzing(false);
          const msg = analyzeErr.response?.data?.message || 'Analysis failed';
          toast.error(msg);
        }
      }
      setFiles([]);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const stageProgress = STAGE_PROGRESS[processingStage] || uploadProgress;

  return (
    <div className="space-y-8 animate-fade-in max-w-3xl mx-auto pb-16 md:pb-0">
      <div>
        <h1 className="text-3xl font-bold">Document Upload</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          Upload PDFs, Word docs, images, scans, invoices, resumes, and more
        </p>
      </div>

      <FileDropzone onFilesSelected={handleFiles} disabled={uploading || analyzing} />

      {files.length > 0 && (
        <div className="card space-y-3">
          <h3 className="font-semibold">Selected Files ({files.length})</h3>
          {files.map(({ file, id }) => (
            <div key={id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className="flex items-center gap-3 min-w-0">
                <File className="w-5 h-5 text-primary-600 shrink-0" />
                <span className="truncate text-sm">{file.name}</span>
                <span className="text-xs text-gray-400 shrink-0">
                  {(file.size / 1024 / 1024).toFixed(2)} MB
                </span>
              </div>
              <button onClick={() => removeFile(id)} className="p-1 hover:text-red-500">
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
          <button
            onClick={handleUploadAndAnalyze}
            disabled={uploading || analyzing}
            className="btn-primary w-full flex items-center justify-center gap-2 py-3"
          >
            {uploading || analyzing ? (
              <LoadingSpinner size="sm" text="Processing..." />
            ) : (
              <>
                <Play className="w-5 h-5" />
                Upload & Analyze
              </>
            )}
          </button>
        </div>
      )}

      {(uploading || analyzing) && (
        <div className="card">
          <ProgressBar
            progress={stageProgress}
            label={analyzing ? 'AI Analysis in progress' : 'Uploading'}
            stage={processingStage}
          />
        </div>
      )}

      {uploadedDocs.length > 0 && (
        <div className="card">
          <h3 className="font-semibold mb-3">Recently Uploaded</h3>
          <ul className="space-y-2">
            {uploadedDocs.map((doc) => (
              <li key={doc._id} className="text-sm flex justify-between">
                <span>{doc.originalName}</span>
                <span className="text-gray-400 capitalize">{doc.status}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
