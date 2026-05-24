import { Pinecone } from '@pinecone-database/pinecone';

let pineconeClient = null;
let indexHost = null;

export const getPineconeClient = () => {
  if (!pineconeClient) {
    if (!process.env.PINECONE_API_KEY) {
      throw new Error('PINECONE_API_KEY is not configured');
    }
    pineconeClient = new Pinecone({ apiKey: process.env.PINECONE_API_KEY });
  }
  return pineconeClient;
};

export const setPineconeIndexHost = (host) => {
  indexHost = host;
};

export const getPineconeIndex = () => {
  const client = getPineconeClient();
  const indexName = process.env.PINECONE_INDEX_NAME || 'document-analyzer';
  if (indexHost) {
    return client.index(indexName, indexHost);
  }
  return client.index(indexName);
};

export const resolvePineconeIndexHost = async () => {
  const indexName = process.env.PINECONE_INDEX_NAME || 'document-analyzer';
  const client = getPineconeClient();
  const description = await client.describeIndex(indexName);
  if (description.host) {
    setPineconeIndexHost(description.host);
    return description.host;
  }
  return null;
};
