import crypto from 'crypto';
import { Document } from '../models/Document.js';
import { extractDocument, extractTables } from './parser.service.js';
import { generateDocumentInsights, explainChartOrTable } from './groq.service.js';
import { chunkDocument } from './embedding.service.js';
import { upsertDocumentChunks, findSimilarDocuments } from './pinecone.service.js';
import { categorizeDocument } from '../utils/fileHelpers.js';
import { ApiError } from '../utils/ApiError.js';

const textHash = (text) =>
  crypto.createHash('sha256').update(text.slice(0, 5000)).digest('hex');

export const processDocument = async (docId, options = {}) => {
  const doc = await Document.findById(docId);
  if (!doc) throw new ApiError(404, 'Document not found');

  try {
    doc.status = 'processing';
    doc.processingStage = 'extracting';
    await doc.save();

    const parsed = await extractDocument(doc.filePath, doc.fileType, {
      language: options.language || doc.ocrLanguage,
    });

    const fullText = parsed.text || parsed.ocrText || '';
    doc.extractedText = fullText;
    if (parsed.ocrText) doc.ocrText = parsed.ocrText;
    if (parsed.ocrConfidence) doc.ocrConfidence = parsed.ocrConfidence;
    if (parsed.ocrLanguage) doc.ocrLanguage = parsed.ocrLanguage;
    doc.metadata = { ...doc.metadata, ...parsed.metadata };

    doc.processingStage = 'categorizing';
    await doc.save();

    doc.category = categorizeDocument(fullText, doc.originalName);

    const tables = extractTables(fullText);
    if (tables.length > 0) {
      doc.processingStage = 'analyzing_tables';
      await doc.save();
      const tableExplanation = await explainChartOrTable(
        JSON.stringify(tables.slice(0, 3)),
        'table'
      );
      doc.metadata = { ...doc.metadata, tableExplanation };
    }

    doc.processingStage = 'detecting_duplicates';
    await doc.save();

    try {
      const similar = await findSimilarDocuments(fullText, doc.userId, 0.92);
      if (similar.length > 0) {
        doc.isDuplicate = true;
        doc.duplicateOf = similar[0].documentId;
      }
    } catch {
      /* duplicate check via vectors is optional */
    }

    const contentHash = textHash(fullText);
    const existingHash = await Document.findOne({
      userId: doc.userId,
      _id: { $ne: doc._id },
      extractedText: { $exists: true },
    }).select('extractedText _id');

    if (existingHash && textHash(existingHash.extractedText) === contentHash) {
      doc.isDuplicate = true;
      doc.duplicateOf = existingHash._id;
    }

    doc.processingStage = 'ai_analysis';
    await doc.save();

    const insights = await generateDocumentInsights(
      fullText,
      doc.originalName,
      doc.category
    );

    insights.tables = tables.length ? tables : insights.tables || [];

    doc.insights = insights;
    doc.processingStage = 'indexing';
    await doc.save();

    const chunks = await chunkDocument(fullText);
    doc.chunkCount = chunks.length;

    let pineconeIds = [];
    try {
      pineconeIds = await upsertDocumentChunks(
        doc._id.toString(),
        doc.userId,
        chunks,
        {
          filename: doc.originalName,
          category: doc.category,
          summary: insights.summary,
          tags: insights.tags || [],
        }
      );
    } catch {
      /* vector indexing is optional — analysis still succeeds */
    }

    doc.pineconeIds = pineconeIds;
    doc.status = 'analyzed';
    doc.processingStage = 'complete';
    await doc.save();

    return doc;
  } catch (error) {
    doc.status = 'failed';
    doc.processingStage = `error: ${error.message}`;
    await doc.save();
    throw error;
  }
};

export const getDocumentReport = (doc) => {
  const lines = [
    `# Document Analysis Report`,
    ``,
    `**File:** ${doc.originalName}`,
    `**Category:** ${doc.category}`,
    `**Date:** ${doc.createdAt.toISOString()}`,
    `**Confidence:** ${doc.insights?.confidence || 'N/A'}%`,
    ``,
    `## Summary`,
    doc.insights?.summary || 'No summary available',
    ``,
    `## Key Insights`,
    ...(doc.insights?.keyInsights || []).map((i) => `- ${i}`),
    ``,
    `## Action Items`,
    ...(doc.insights?.actionItems || []).map((a) => `- [ ] ${a}`),
    ``,
    `## Entities`,
    (doc.insights?.entities || []).join(', '),
    ``,
    `## Highlights`,
    ...(doc.insights?.highlights || []).map((h) => `> ${h}`),
    ``,
    `## Sentiment`,
    doc.insights?.sentiment || 'neutral',
  ];
  return lines.join('\n');
};
