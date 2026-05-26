import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';
import { getGroqClient } from '../config/groq.js';
import { getTraceArgs, makeTraceable, traceTextInput } from '../utils/langsmith.js';

const EMBEDDING_DIM = parseInt(process.env.PINECONE_DIMENSION, 10) || 768;

const simpleHashEmbed = (text) => {
  const vector = new Array(EMBEDDING_DIM).fill(0);
  const normalized = text.toLowerCase().replace(/\s+/g, ' ');

  for (let i = 0; i < normalized.length; i++) {
    const charCode = normalized.charCodeAt(i);
    const idx = (charCode * (i + 1)) % EMBEDDING_DIM;
    vector[idx] += Math.sin(charCode * 0.01) * 0.1;
  }

  const words = normalized.split(' ').filter(Boolean);
  words.forEach((word, wi) => {
    for (let ci = 0; ci < word.length; ci++) {
      const idx = (word.charCodeAt(ci) * 31 + wi * 17) % EMBEDDING_DIM;
      vector[idx] += 0.05;
    }
  });

  const magnitude = Math.sqrt(vector.reduce((sum, v) => sum + v * v, 0)) || 1;
  return vector.map((v) => v / magnitude);
};

export const generateEmbedding = makeTraceable(async (text) => {
  try {
    const client = getGroqClient();
    const response = await client.chat.completions.create({
      model: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
      messages: [
        {
          role: 'system',
          content: `Return ONLY a JSON array of exactly ${EMBEDDING_DIM} floating point numbers between -1 and 1 representing a semantic embedding of the input text. No explanation.`,
        },
        { role: 'user', content: text.slice(0, 2000) },
      ],
      temperature: 0,
      max_tokens: 4096,
    });

    const content = response.choices[0]?.message?.content || '';
    const match = content.match(/\[[\s\S]*\]/);
    if (match) {
      const parsed = JSON.parse(match[0]);
      if (Array.isArray(parsed) && parsed.length === EMBEDDING_DIM) {
        const mag = Math.sqrt(parsed.reduce((s, v) => s + v * v, 0)) || 1;
        return parsed.map((v) => v / mag);
      }
    }
  } catch {
    /* fallback below */
  }

  return simpleHashEmbed(text);
}, {
  name: 'generateEmbedding',
  run_type: 'llm',
  processInputs: ({ input }) => traceTextInput(input),
  processOutputs: ({ outputs }) => ({
    dimensions: outputs?.length || 0,
    sample: outputs?.slice(0, 5) || [],
  }),
  getInvocationParams: () => ({
    model: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
    provider: 'groq',
    embedding_dimension: EMBEDDING_DIM,
  }),
});

export const chunkDocument = makeTraceable(async (text, chunkSize = 800, overlap = 150) => {
  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize,
    chunkOverlap: overlap,
  });
  return splitter.splitText(text);
}, {
  name: 'chunkDocument',
  run_type: 'tool',
  processInputs: (inputs) => {
    const args = getTraceArgs(inputs);
    return traceTextInput(args[0], {
      chunkSize: args[1] || 800,
      overlap: args[2] || 150,
    });
  },
  processOutputs: ({ outputs }) => ({
    chunkCount: outputs?.length || 0,
    firstChunkLength: outputs?.[0]?.length || 0,
  }),
});

export const computeSimilarity = (vecA, vecB) => {
  let dot = 0;
  for (let i = 0; i < vecA.length; i++) {
    dot += vecA[i] * vecB[i];
  }
  return dot;
};
