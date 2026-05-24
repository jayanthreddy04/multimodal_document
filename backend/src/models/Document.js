import mongoose from 'mongoose';

const insightSchema = new mongoose.Schema(
  {
    summary: String,
    keyInsights: [String],
    actionItems: [String],
    entities: [String],
    sentiment: { type: String, enum: ['positive', 'neutral', 'negative', 'mixed'], default: 'neutral' },
    highlights: [String],
    confidence: { type: Number, default: 0 },
    tables: [mongoose.Schema.Types.Mixed],
    tags: [String],
  },
  { _id: false }
);

const documentSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    filename: { type: String, required: true },
    originalName: { type: String, required: true },
    mimetype: String,
    fileType: { type: String, enum: ['pdf', 'docx', 'txt', 'image', 'unknown'] },
    filePath: String,
    fileSize: Number,
    category: { type: String, default: 'general' },
    extractedText: String,
    ocrText: String,
    ocrConfidence: Number,
    ocrLanguage: { type: String, default: 'eng' },
    metadata: {
      pages: Number,
      wordCount: Number,
      language: String,
    },
    insights: insightSchema,
    status: {
      type: String,
      enum: ['uploaded', 'processing', 'analyzed', 'failed'],
      default: 'uploaded',
    },
    processingStage: String,
    duplicateOf: { type: mongoose.Schema.Types.ObjectId, ref: 'Document' },
    isDuplicate: { type: Boolean, default: false },
    pineconeIds: [String],
    chunkCount: { type: Number, default: 0 },
    chatHistory: [
      {
        role: { type: String, enum: ['user', 'assistant'] },
        content: String,
        timestamp: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

documentSchema.index({ userId: 1, createdAt: -1 });
documentSchema.index({ 'insights.tags': 1 });

export const Document = mongoose.model('Document', documentSchema);
