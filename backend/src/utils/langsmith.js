import { traceable } from 'langsmith/traceable';

const TRACE_FULL_INPUTS = process.env.LANGSMITH_TRACE_FULL_INPUTS === 'true';
const PREVIEW_LIMIT = parseInt(process.env.LANGSMITH_TRACE_PREVIEW_LIMIT, 10) || 700;

const truncate = (value, limit = PREVIEW_LIMIT) => {
  if (typeof value !== 'string') return value;
  if (TRACE_FULL_INPUTS || value.length <= limit) return value;
  return `${value.slice(0, limit)}... [truncated ${value.length - limit} chars]`;
};

export const traceTextInput = (text, extra = {}) => ({
  ...extra,
  text: truncate(text),
  textLength: typeof text === 'string' ? text.length : 0,
});

export const traceMessagesInput = (messages = [], options = {}) => ({
  model: options.model,
  temperature: options.temperature,
  maxTokens: options.maxTokens,
  jsonMode: options.jsonMode,
  messageCount: messages.length,
  messages: messages.map((message) => ({
    ...message,
    content: truncate(message.content),
    contentLength: typeof message.content === 'string' ? message.content.length : 0,
  })),
});

export const traceOutput = (output, key = 'output') => ({
  [key]: truncate(output),
  [`${key}Length`]: typeof output === 'string' ? output.length : undefined,
});

export const getTraceArgs = (inputs) => {
  if (Array.isArray(inputs?.args)) return inputs.args;
  if (Object.prototype.hasOwnProperty.call(inputs || {}, 'input')) return [inputs.input];
  return [inputs];
};

export const makeTraceable = (fn, config = {}) =>
  traceable(fn, {
    ...config,
    metadata: {
      service: 'multimodal-document-analyzer',
      ...config.metadata,
    },
  });
