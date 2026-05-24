import fs from 'fs/promises';
import { Document } from '../models/Document.js';
import { processDocument, getDocumentReport } from '../services/document.service.js';
import { runOCR } from '../services/ocr.service.js';
import { deleteDocumentVectors } from '../services/pinecone.service.js';
import { getFileType } from '../utils/fileHelpers.js';
import { catchAsync } from '../utils/catchAsync.js';
import { ApiError } from '../utils/ApiError.js';

export const uploadDocument = catchAsync(async (req, res) => {
  if (!req.file) {
    throw new ApiError(400, 'No file uploaded');
  }

  const fileType = getFileType(req.file.mimetype, req.file.originalname);

  const doc = await Document.create({
    userId: req.user._id,
    filename: req.file.filename,
    originalName: req.file.originalname,
    mimetype: req.file.mimetype,
    fileType,
    filePath: req.file.path,
    fileSize: req.file.size,
    status: 'uploaded',
    processingStage: 'queued',
  });

  res.status(201).json({
    success: true,
    message: 'File uploaded successfully',
    data: { document: doc },
  });
});

export const uploadMultiple = catchAsync(async (req, res) => {
  if (!req.files?.length) {
    throw new ApiError(400, 'No files uploaded');
  }

  const documents = await Promise.all(
    req.files.map((file) =>
      Document.create({
        userId: req.user._id,
        filename: file.filename,
        originalName: file.originalname,
        mimetype: file.mimetype,
        fileType: getFileType(file.mimetype, file.originalname),
        filePath: file.path,
        fileSize: file.size,
        status: 'uploaded',
      })
    )
  );

  res.status(201).json({
    success: true,
    message: `${documents.length} files uploaded`,
    data: { documents },
  });
});

export const analyzeDocument = catchAsync(async (req, res) => {
  const doc = await Document.findOne({
    _id: req.params.id,
    userId: req.user._id,
  });

  if (!doc) throw new ApiError(404, 'Document not found');

  const analyzed = await processDocument(doc._id, {
    language: req.body.language,
  });

  res.json({
    success: true,
    message: 'Document analyzed successfully',
    data: { document: analyzed },
  });
});

export const getDocument = catchAsync(async (req, res) => {
  const doc = await Document.findOne({
    _id: req.params.id,
    userId: req.user._id,
  });

  if (!doc) throw new ApiError(404, 'Document not found');

  res.json({ success: true, data: { document: doc } });
});

export const getHistory = catchAsync(async (req, res) => {
  const { page = 1, limit = 20, category, status, search } = req.query;
  const filter = { userId: req.user._id };

  if (category) filter.category = category;
  if (status) filter.status = status;
  if (search) {
    filter.$or = [
      { originalName: { $regex: search, $options: 'i' } },
      { 'insights.summary': { $regex: search, $options: 'i' } },
      { 'insights.tags': { $regex: search, $options: 'i' } },
    ];
  }

  const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);

  const [documents, total] = await Promise.all([
    Document.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit, 10))
      .select('-extractedText -chatHistory'),
    Document.countDocuments(filter),
  ]);

  res.json({
    success: true,
    data: {
      documents,
      pagination: {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        total,
        pages: Math.ceil(total / parseInt(limit, 10)),
      },
    },
  });
});

export const deleteDocument = catchAsync(async (req, res) => {
  const doc = await Document.findOne({
    _id: req.params.id,
    userId: req.user._id,
  });

  if (!doc) throw new ApiError(404, 'Document not found');

  if (doc.pineconeIds?.length) {
    await deleteDocumentVectors(doc.pineconeIds);
  }

  if (doc.filePath) {
    await fs.unlink(doc.filePath).catch(() => {});
  }

  await doc.deleteOne();

  res.json({ success: true, message: 'Document deleted' });
});

export const runOcrOnDocument = catchAsync(async (req, res) => {
  const doc = await Document.findOne({
    _id: req.params.id,
    userId: req.user._id,
  });

  if (!doc) throw new ApiError(404, 'Document not found');

  const language = req.body.language || doc.ocrLanguage || 'eng';
  const result = await runOCR(doc.filePath, language);

  doc.ocrText = result.text;
  doc.ocrConfidence = result.confidence;
  doc.ocrLanguage = result.language;
  if (!doc.extractedText) doc.extractedText = result.text;
  await doc.save();

  res.json({
    success: true,
    data: {
      ocr: result,
      document: doc,
    },
  });
});

export const exportReport = catchAsync(async (req, res) => {
  const doc = await Document.findOne({
    _id: req.params.id,
    userId: req.user._id,
  });

  if (!doc) throw new ApiError(404, 'Document not found');

  const format = req.query.format || 'txt';
  const report = getDocumentReport(doc);

  if (format === 'json') {
    return res.json({
      success: true,
      data: { report: doc.insights, metadata: doc.metadata },
    });
  }

  res.setHeader('Content-Type', 'text/plain');
  res.setHeader(
    'Content-Disposition',
    `attachment; filename="${doc.originalName}-report.${format}"`
  );
  res.send(report);
});

export const getProcessingStatus = catchAsync(async (req, res) => {
  const doc = await Document.findOne({
    _id: req.params.id,
    userId: req.user._id,
  }).select('status processingStage originalName');

  if (!doc) throw new ApiError(404, 'Document not found');

  res.json({
    success: true,
    data: {
      status: doc.status,
      processingStage: doc.processingStage,
      filename: doc.originalName,
    },
  });
});
