import path from 'path';

export const ALLOWED_MIME_TYPES = {
  'application/pdf': 'pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
  'text/plain': 'txt',
  'image/png': 'image',
  'image/jpeg': 'image',
  'image/jpg': 'image',
};

export const ALLOWED_EXTENSIONS = ['.pdf', '.docx', '.txt', '.png', '.jpg', '.jpeg'];

export const getFileType = (mimetype, filename) => {
  if (ALLOWED_MIME_TYPES[mimetype]) {
    return ALLOWED_MIME_TYPES[mimetype];
  }
  const ext = path.extname(filename).toLowerCase();
  const map = {
    '.pdf': 'pdf',
    '.docx': 'docx',
    '.txt': 'txt',
    '.png': 'image',
    '.jpg': 'image',
    '.jpeg': 'image',
  };
  return map[ext] || 'unknown';
};

export const categorizeDocument = (text, filename) => {
  const lower = `${text} ${filename}`.toLowerCase();
  if (/invoice|bill|payment|receipt/.test(lower)) return 'invoice';
  if (/resume|cv|curriculum|experience|skills/.test(lower)) return 'resume';
  if (/contract|agreement|terms/.test(lower)) return 'contract';
  if (/report|analysis|summary/.test(lower)) return 'report';
  if (/chart|graph|table|data/.test(lower)) return 'data';
  if (/note|handwritten|memo/.test(lower)) return 'notes';
  return 'general';
};
