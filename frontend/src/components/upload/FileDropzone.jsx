import { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileText, Image, File } from 'lucide-react';

const ACCEPTED = {
  'application/pdf': ['.pdf'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
  'text/plain': ['.txt'],
  'image/png': ['.png'],
  'image/jpeg': ['.jpg', '.jpeg'],
};

export default function FileDropzone({ onFilesSelected, multiple = true, disabled = false }) {
  const onDrop = useCallback(
    (accepted) => {
      if (accepted.length) onFilesSelected(accepted);
    },
    [onFilesSelected]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: ACCEPTED,
    multiple,
    disabled,
    maxSize: 25 * 1024 * 1024,
  });

  return (
    <div
      {...getRootProps()}
      className={`card border-2 border-dashed cursor-pointer transition-all duration-300 ${
        isDragActive
          ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 scale-[1.02]'
          : 'border-gray-300 dark:border-gray-700 hover:border-primary-400'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      <input {...getInputProps()} />
      <div className="flex flex-col items-center gap-4 py-8">
        <div className="p-4 bg-primary-100 dark:bg-primary-900/30 rounded-full">
          <Upload className="w-10 h-10 text-primary-600" />
        </div>
        <div className="text-center">
          <p className="text-lg font-semibold">
            {isDragActive ? 'Drop files here' : 'Drag & drop documents here'}
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            or click to browse — PDF, DOCX, TXT, PNG, JPG (max 25MB)
          </p>
        </div>
        <div className="flex gap-4 text-gray-400">
          <FileText className="w-6 h-6" title="PDF/DOCX" />
          <Image className="w-6 h-6" title="Images" />
          <File className="w-6 h-6" title="TXT" />
        </div>
      </div>
    </div>
  );
}
