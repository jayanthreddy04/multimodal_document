import { body } from 'express-validator';
import { Document } from '../models/Document.js';
import { semanticSearch } from '../services/pinecone.service.js';
import { generateSearchSummary } from '../services/groq.service.js';
import { catchAsync } from '../utils/catchAsync.js';

export const searchValidation = [
  body('query').trim().notEmpty().withMessage('Search query is required'),
];

export const semanticDocumentSearch = catchAsync(async (req, res) => {
  const { query, limit = 10 } = req.body;

  const vectorResults = await semanticSearch(query, req.user._id, parseInt(limit, 10));

  let results = [];

  if (vectorResults.matches?.length) {
    const docIds = [...new Set(vectorResults.matches.map((m) => m.documentId))];
    const documents = await Document.find({
      _id: { $in: docIds },
      userId: req.user._id,
    }).select('originalName category insights.summary insights.tags status createdAt');

    const docMap = Object.fromEntries(documents.map((d) => [d._id.toString(), d]));

    results = vectorResults.matches.map((match) => {
      const doc = docMap[match.documentId];
      return {
        documentId: match.documentId,
        score: match.score,
        snippet: match.text,
        filename: match.filename || doc?.originalName,
        category: match.category || doc?.category,
        summary: doc?.insights?.summary?.slice(0, 200),
        tags: doc?.insights?.tags,
        status: doc?.status,
        createdAt: doc?.createdAt,
      };
    });
  }

  if (vectorResults.fallback || !results.length) {
    const textResults = await Document.find({
      userId: req.user._id,
      $or: [
        { extractedText: { $regex: query, $options: 'i' } },
        { originalName: { $regex: query, $options: 'i' } },
        { 'insights.summary': { $regex: query, $options: 'i' } },
        { 'insights.keyInsights': { $regex: query, $options: 'i' } },
      ],
    })
      .limit(parseInt(limit, 10))
      .select('originalName category insights.summary status createdAt extractedText');

    results = textResults.map((doc) => ({
      documentId: doc._id,
      score: 0.5,
      snippet: (doc.extractedText || doc.insights?.summary || '').slice(0, 300),
      filename: doc.originalName,
      category: doc.category,
      summary: doc.insights?.summary?.slice(0, 200),
      status: doc.status,
      createdAt: doc.createdAt,
      fallback: true,
    }));
  }

  let aiSummary = '';
  if (results.length) {
    aiSummary = await generateSearchSummary(query, results.slice(0, 5));
  }

  res.json({
    success: true,
    data: {
      query,
      results,
      aiSummary,
      total: results.length,
    },
  });
});
