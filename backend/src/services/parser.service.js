import fs from 'fs/promises';
import pdfParse from 'pdf-parse';
import mammoth from 'mammoth';
import { runOCR, detectLanguage } from './ocr.service.js';

export const parsePDF = async (filePath) => {
  const buffer = await fs.readFile(filePath);
  const data = await pdfParse(buffer);
  return {
    text: data.text.trim(),
    metadata: {
      pages: data.numpages,
      wordCount: data.text.split(/\s+/).filter(Boolean).length,
    },
  };
};

export const parseDOCX = async (filePath) => {
  const buffer = await fs.readFile(filePath);
  const result = await mammoth.extractRawText({ buffer });
  const text = result.value.trim();
  return {
    text,
    metadata: {
      wordCount: text.split(/\s+/).filter(Boolean).length,
    },
  };
};

export const parseTXT = async (filePath) => {
  const text = (await fs.readFile(filePath, 'utf-8')).trim();
  return {
    text,
    metadata: {
      wordCount: text.split(/\s+/).filter(Boolean).length,
    },
  };
};

export const parseImage = async (filePath, language) => {
  const detectedLang = language || (await detectLanguage(filePath));
  const ocr = await runOCR(filePath, detectedLang);
  return {
    text: ocr.text,
    ocrText: ocr.text,
    ocrConfidence: ocr.confidence,
    ocrLanguage: ocr.language,
    metadata: {
      wordCount: ocr.wordCount,
      language: ocr.language,
    },
  };
};

export const extractDocument = async (filePath, fileType, options = {}) => {
  switch (fileType) {
    case 'pdf': {
      const parsed = await parsePDF(filePath);
      if (!parsed.text || parsed.text.length < 50) {
        const ocr = await parseImage(filePath, options.language);
        return { ...parsed, text: ocr.text || parsed.text, ocrText: ocr.ocrText, ocrConfidence: ocr.ocrConfidence };
      }
      return parsed;
    }
    case 'docx':
      return parseDOCX(filePath);
    case 'txt':
      return parseTXT(filePath);
    case 'image':
      return parseImage(filePath, options.language);
    default:
      throw new Error(`Unsupported file type: ${fileType}`);
  }
};

export const extractTables = (text) => {
  const tablePattern = /(\|.+\|[\r\n]+)+/g;
  const matches = text.match(tablePattern) || [];
  return matches.map((table, i) => {
    const rows = table.trim().split('\n').map((row) =>
      row
        .split('|')
        .map((c) => c.trim())
        .filter(Boolean)
    );
    return { id: i + 1, rows, rowCount: rows.length };
  });
};
