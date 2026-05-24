import app from '../backend/src/app.js';
import { connectDB } from '../backend/src/config/db.js';
import { ensurePineconeIndex } from '../backend/src/services/pinecone.service.js';

let bootstrapPromise;

const bootstrap = async () => {
  await connectDB();
  await ensurePineconeIndex();
};

export default async function handler(req, res) {
  bootstrapPromise ||= bootstrap();
  await bootstrapPromise;
  return app(req, res);
}
