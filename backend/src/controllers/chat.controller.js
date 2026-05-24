import { body } from 'express-validator';
import { Document } from '../models/Document.js';
import { answerQuestion } from '../services/groq.service.js';
import { semanticSearch } from '../services/pinecone.service.js';
import { catchAsync } from '../utils/catchAsync.js';
import { ApiError } from '../utils/ApiError.js';

export const chatValidation = [
  body('message').trim().notEmpty().withMessage('Message is required'),
  body('documentId').optional().isMongoId(),
];

export const chatWithDocument = catchAsync(async (req, res) => {
  const { message, documentId } = req.body;

  let context = '';
  let doc = null;

  if (documentId) {
    doc = await Document.findOne({ _id: documentId, userId: req.user._id });
    if (!doc) throw new ApiError(404, 'Document not found');

    const searchResults = await semanticSearch(message, req.user._id, 5);
    const relevantChunks = searchResults.matches
      .filter((m) => m.documentId === documentId)
      .map((m) => m.text)
      .join('\n\n');

    context = relevantChunks || doc.extractedText || doc.ocrText || '';
    if (doc.insights?.summary) {
      context = `Summary: ${doc.insights.summary}\n\n${context}`;
    }
  } else {
    const searchResults = await semanticSearch(message, req.user._id, 8);
    context = searchResults.matches.map((m) => `[${m.filename}]: ${m.text}`).join('\n\n');
  }

  const chatHistory = doc?.chatHistory || [];

  const answer = await answerQuestion(message, context, chatHistory);

  if (doc) {
    doc.chatHistory.push(
      { role: 'user', content: message },
      { role: 'assistant', content: answer }
    );
    if (doc.chatHistory.length > 50) {
      doc.chatHistory = doc.chatHistory.slice(-50);
    }
    await doc.save();
  }

  res.json({
    success: true,
    data: {
      answer,
      documentId: doc?._id,
      sources: doc
        ? [{ filename: doc.originalName, type: 'document' }]
        : [],
    },
  });
});
