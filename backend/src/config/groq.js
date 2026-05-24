import Groq from 'groq-sdk';

let groqClient = null;

export const getGroqClient = () => {
  if (!groqClient) {
    if (!process.env.GROQ_API_KEY) {
      throw new Error('GROQ_API_KEY is not configured');
    }
    groqClient = new Groq({ apiKey: process.env.GROQ_API_KEY });
  }
  return groqClient;
};

export const GROQ_MODEL = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';
