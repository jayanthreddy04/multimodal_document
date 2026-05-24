/**
 * Create Pinecone index: node scripts/setup-pinecone.js
 * Requires PINECONE_API_KEY in backend/.env
 */
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { Pinecone } from '@pinecone-database/pinecone';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env') });

const INDEX_NAME = process.env.PINECONE_INDEX_NAME || 'document-analyzer';
const DIMENSION = parseInt(process.env.PINECONE_DIMENSION, 10) || 768;

if (!process.env.PINECONE_API_KEY) {
  console.error('PINECONE_API_KEY missing in backend/.env');
  process.exit(1);
}

const client = new Pinecone({ apiKey: process.env.PINECONE_API_KEY });

const list = await client.listIndexes();
const names = list.indexes?.map((i) => i.name) || [];

if (names.includes(INDEX_NAME)) {
  console.log(`Index "${INDEX_NAME}" already exists`);
} else {
  console.log(`Creating index "${INDEX_NAME}" (dimension ${DIMENSION})...`);
  await client.createIndex({
    name: INDEX_NAME,
    dimension: DIMENSION,
    metric: 'cosine',
    spec: { serverless: { cloud: 'aws', region: 'us-east-1' } },
  });
  console.log(`Done. Index "${INDEX_NAME}" is ready.`);
}
