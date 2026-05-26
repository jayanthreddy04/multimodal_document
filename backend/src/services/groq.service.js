import { getGroqClient, GROQ_MODEL } from '../config/groq.js';
import {
  getTraceArgs,
  makeTraceable,
  traceMessagesInput,
  traceOutput,
  traceTextInput,
} from '../utils/langsmith.js';

const chat = makeTraceable(async (messages, options = {}) => {
  const client = getGroqClient();
  const response = await client.chat.completions.create({
    model: options.model || GROQ_MODEL,
    messages,
    temperature: options.temperature ?? 0.3,
    max_tokens: options.maxTokens || 4096,
    response_format: options.jsonMode ? { type: 'json_object' } : undefined,
  });
  return response.choices[0]?.message?.content || '';
}, {
  name: 'groq.chat.completions',
  run_type: 'llm',
  processInputs: (inputs) => {
    const args = getTraceArgs(inputs);
    return traceMessagesInput(args[0], args[1]);
  },
  processOutputs: ({ outputs }) => traceOutput(outputs),
  getInvocationParams: (_messages, options = {}) => ({
    model: options.model || GROQ_MODEL,
    provider: 'groq',
    temperature: options.temperature ?? 0.3,
    max_tokens: options.maxTokens || 4096,
  }),
});

export const generateDocumentInsights = makeTraceable(async (text, filename, category) => {
  const truncated = text.slice(0, 12000);
  const prompt = `Analyze this document and return JSON only with these fields:
- summary: string (2-3 paragraphs)
- keyInsights: string[] (5-8 items)
- actionItems: string[] (3-5 items)
- entities: string[] (people, orgs, dates, amounts)
- sentiment: "positive"|"neutral"|"negative"|"mixed"
- highlights: string[] (important quoted sections)
- confidence: number 0-100
- tags: string[] (metadata tags)
- tables: array of {description, data} for any tables detected

Document: ${filename}
Category: ${category}
Content:
${truncated}`;

  const raw = await chat(
    [
      { role: 'system', content: 'You are an expert document analyst. Always respond with valid JSON only.' },
      { role: 'user', content: prompt },
    ],
    { jsonMode: true, temperature: 0.2 }
  );

  try {
    return JSON.parse(raw);
  } catch {
    return {
      summary: raw.slice(0, 500),
      keyInsights: ['Analysis completed with partial structured output'],
      actionItems: [],
      entities: [],
      sentiment: 'neutral',
      highlights: [],
      confidence: 70,
      tags: [category],
      tables: [],
    };
  }
}, {
  name: 'generateDocumentInsights',
  run_type: 'chain',
  processInputs: (inputs) => {
    const args = getTraceArgs(inputs);
    return traceTextInput(args[0], {
      filename: args[1],
      category: args[2],
    });
  },
  processOutputs: (outputs) => ({
    summary: outputs.summary,
    keyInsightCount: outputs.keyInsights?.length || 0,
    actionItemCount: outputs.actionItems?.length || 0,
    entityCount: outputs.entities?.length || 0,
    sentiment: outputs.sentiment,
    confidence: outputs.confidence,
    tags: outputs.tags,
    tableCount: outputs.tables?.length || 0,
  }),
});

export const answerQuestion = makeTraceable(async (question, context, chatHistory = []) => {
  const truncatedContext = context.slice(0, 10000);
  const historyMessages = chatHistory.slice(-6).map((m) => ({
    role: m.role,
    content: m.content,
  }));

  return chat([
    {
      role: 'system',
      content: `You are a helpful document assistant. Answer questions based ONLY on the provided document context. If the answer is not in the context, say so clearly. Be concise and cite relevant sections when possible.`,
    },
    ...historyMessages,
    {
      role: 'user',
      content: `Document Context:\n${truncatedContext}\n\nQuestion: ${question}`,
    },
  ]);
}, {
  name: 'answerQuestion',
  run_type: 'chain',
  processInputs: (inputs) => {
    const args = getTraceArgs(inputs);
    return traceTextInput(args[1], {
      question: args[0],
      chatHistoryCount: args[2]?.length || 0,
    });
  },
  processOutputs: ({ outputs }) => traceOutput(outputs, 'answer'),
});

export const generateSearchSummary = makeTraceable(async (query, results) => {
  const context = results
    .map((r, i) => `[${i + 1}] ${r.filename}: ${r.snippet}`)
    .join('\n');

  return chat([
    {
      role: 'system',
      content: 'Summarize search results relevant to the user query in 2-3 sentences.',
    },
    {
      role: 'user',
      content: `Query: ${query}\n\nResults:\n${context}`,
    },
  ], { maxTokens: 300 });
}, {
  name: 'generateSearchSummary',
  run_type: 'chain',
  processInputs: (inputs) => {
    const args = getTraceArgs(inputs);
    return {
      query: args[0],
      resultCount: args[1]?.length || 0,
      results: (args[1] || []).map((result) => ({
        filename: result.filename,
        category: result.category,
        score: result.score,
        snippet: traceOutput(result.snippet, 'snippet').snippet,
      })),
    };
  },
  processOutputs: ({ outputs }) => traceOutput(outputs, 'summary'),
});

export const explainChartOrTable = makeTraceable(async (content, type = 'table') => {
  return chat([
    {
      role: 'system',
      content: `Explain the following ${type} data clearly for a non-technical audience.`,
    },
    { role: 'user', content: content.slice(0, 4000) },
  ], { maxTokens: 800 });
}, {
  name: 'explainChartOrTable',
  run_type: 'chain',
  processInputs: (inputs) => {
    const args = getTraceArgs(inputs);
    return traceTextInput(args[0], { type: args[1] || 'table' });
  },
  processOutputs: ({ outputs }) => traceOutput(outputs, 'explanation'),
});

export const generateReport = makeTraceable(async (document) => {
  const { insights, extractedText, originalName, category } = document;
  return chat([
    {
      role: 'system',
      content: 'Generate a professional markdown report from the document analysis.',
    },
    {
      role: 'user',
      content: `Create a downloadable report for: ${originalName}
Category: ${category}
Summary: ${insights?.summary || 'N/A'}
Key Insights: ${(insights?.keyInsights || []).join('; ')}
Action Items: ${(insights?.actionItems || []).join('; ')}
Entities: ${(insights?.entities || []).join(', ')}
Sentiment: ${insights?.sentiment}
Sample Content: ${(extractedText || '').slice(0, 2000)}`,
    },
  ], { maxTokens: 2000 });
}, {
  name: 'generateReport',
  run_type: 'chain',
  processInputs: (inputs) => {
    const args = getTraceArgs(inputs);
    const document = args[0] || {};
    return {
      documentId: document._id?.toString(),
      filename: document.originalName,
      category: document.category,
      hasInsights: Boolean(document.insights),
      extractedTextLength: document.extractedText?.length || 0,
    };
  },
  processOutputs: ({ outputs }) => traceOutput(outputs, 'report'),
});
