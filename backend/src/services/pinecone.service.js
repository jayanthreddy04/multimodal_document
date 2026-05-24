import { v4 as uuidv4 } from 'uuid';
import { getPineconeClient, getPineconeIndex, resolvePineconeIndexHost } from '../config/pinecone.js';
import { generateEmbedding } from './embedding.service.js';

const isPineconeConfigured = () =>
  Boolean(process.env.PINECONE_API_KEY && process.env.PINECONE_INDEX_NAME);

const isPineconeSkipped = () =>
  process.env.SKIP_PINECONE === 'true' || process.env.SKIP_PINECONE === '1';

const pineconeWarning = (action, err) => {
  const msg = err?.message || String(err);
  if (msg.includes('404') || msg.includes('not found')) {
    console.warn(
      `[Pinecone] ${action} skipped — index "${process.env.PINECONE_INDEX_NAME || 'document-analyzer'}" not found. ` +
        'Run: cd backend && node scripts/setup-pinecone.js (or set SKIP_PINECONE=true)'
    );
  } else {
    console.warn(`[Pinecone] ${action} failed:`, msg);
  }
};

export const upsertDocumentChunks = async (documentId, userId, chunks, metadata) => {
  if (!isPineconeConfigured() || isPineconeSkipped() || !chunks?.length) {
    return [];
  }

  try {
    const index = getPineconeIndex();
    const vectors = [];

    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      const id = `${documentId}_chunk_${i}_${uuidv4().slice(0, 8)}`;
      const values = await generateEmbedding(chunk);

      vectors.push({
        id,
        values,
        metadata: {
          documentId,
          userId: userId.toString(),
          chunkIndex: i,
          text: chunk.slice(0, 1000),
          filename: metadata.filename,
          category: metadata.category,
          summary: (metadata.summary || '').slice(0, 500),
          tags: metadata.tags || [],
        },
      });
    }

    const batchSize = 100;
    for (let i = 0; i < vectors.length; i += batchSize) {
      await index.upsert(vectors.slice(i, i + batchSize));
    }

    return vectors.map((v) => v.id);
  } catch (err) {
    pineconeWarning('Vector indexing', err);
    return [];
  }
};

export const semanticSearch = async (query, userId, topK = 10) => {
  if (!isPineconeConfigured() || isPineconeSkipped()) {
    return { matches: [], fallback: true };
  }

  try {
    const index = getPineconeIndex();
    const queryVector = await generateEmbedding(query);

    const results = await index.query({
      vector: queryVector,
      topK,
      includeMetadata: true,
      filter: { userId: userId.toString() },
    });

    return {
      matches: (results.matches || []).map((m) => ({
        id: m.id,
        score: m.score,
        documentId: m.metadata?.documentId,
        text: m.metadata?.text,
        filename: m.metadata?.filename,
        category: m.metadata?.category,
        chunkIndex: m.metadata?.chunkIndex,
      })),
      fallback: false,
    };
  } catch (err) {
    pineconeWarning('Semantic search', err);
    return { matches: [], fallback: true };
  }
};

export const deleteDocumentVectors = async (pineconeIds) => {
  if (!isPineconeConfigured() || isPineconeSkipped() || !pineconeIds?.length) return;

  try {
    const index = getPineconeIndex();
    await index.deleteMany(pineconeIds);
  } catch (err) {
    pineconeWarning('Delete vectors', err);
  }
};

export const findSimilarDocuments = async (text, userId, threshold = 0.85) => {
  try {
    const result = await semanticSearch(text.slice(0, 500), userId, 5);
    return result.matches.filter((m) => m.score >= threshold);
  } catch {
    return [];
  }
};

export const ensurePineconeIndex = async () => {
  if (!isPineconeConfigured() || isPineconeSkipped()) return false;

  const indexName = process.env.PINECONE_INDEX_NAME || 'document-analyzer';
  const dimension = parseInt(process.env.PINECONE_DIMENSION, 10) || 768;

  try {
    const client = getPineconeClient();
    const list = await client.listIndexes();
    const names = list.indexes?.map((i) => i.name) || [];

    if (names.includes(indexName)) {
      await resolvePineconeIndexHost();
      console.log(`[Pinecone] Connected to index "${indexName}"`);
      return true;
    }

    console.log(`[Pinecone] Creating index "${indexName}"...`);
    await client.createIndex({
      name: indexName,
      dimension,
      metric: 'cosine',
      spec: { serverless: { cloud: 'aws', region: 'us-east-1' } },
    });
    console.log(`[Pinecone] Index "${indexName}" created — waiting to be ready...`);
    await new Promise((r) => setTimeout(r, 5000));
    await resolvePineconeIndexHost();
    return true;
  } catch (err) {
    pineconeWarning('Index setup', err);
    return false;
  }
};
