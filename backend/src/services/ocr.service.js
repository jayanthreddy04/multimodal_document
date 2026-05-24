import Tesseract from 'tesseract.js';
import sharp from 'sharp';
import fs from 'fs/promises';

const LANGUAGE_MAP = {
  eng: 'eng',
  spa: 'spa',
  fra: 'fra',
  deu: 'deu',
  hin: 'hin',
  chi_sim: 'chi_sim',
  jpn: 'jpn',
  ara: 'ara',
};

export const runOCR = async (filePath, language = 'eng') => {
  const lang = LANGUAGE_MAP[language] || language || 'eng';

  let processedPath = filePath;
  const tempPath = `${filePath}_processed.png`;

  try {
    await sharp(filePath)
      .greyscale()
      .normalize()
      .sharpen()
      .png()
      .toFile(tempPath);
    processedPath = tempPath;
  } catch {
    processedPath = filePath;
  }

  const result = await Tesseract.recognize(processedPath, lang, {
    logger: () => {},
  });

  if (processedPath !== filePath) {
    await fs.unlink(tempPath).catch(() => {});
  }

  const { text, confidence } = result.data;
  const words = result.data.words || [];

  return {
    text: text.trim(),
    confidence: Math.round(confidence),
    language: lang,
    wordCount: words.length,
    blocks: result.data.blocks?.length || 0,
  };
};

export const detectLanguage = async (filePath) => {
  try {
    const quick = await Tesseract.recognize(filePath, 'eng', { logger: () => {} });
    const sample = quick.data.text.slice(0, 500);
    if (/[\u4e00-\u9fff]/.test(sample)) return 'chi_sim';
    if (/[\u3040-\u30ff]/.test(sample)) return 'jpn';
    if (/[\u0600-\u06ff]/.test(sample)) return 'ara';
    if (/[\u0900-\u097F]/.test(sample)) return 'hin';
    return 'eng';
  } catch {
    return 'eng';
  }
};
