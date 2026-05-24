import { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import { Send, Bot, User, MessageSquare } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { fetchHistory } from '../store/slices/documentSlice';
import { chatAPI } from '../services/api';
import LoadingSpinner from '../components/common/LoadingSpinner';

export default function Chat() {
  const dispatch = useDispatch();
  const { documents } = useSelector((state) => state.documents);
  const [selectedDoc, setSelectedDoc] = useState('');
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    dispatch(fetchHistory({ status: 'analyzed', limit: 50 }));
  }, [dispatch]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMsg = { role: 'user', content: input };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const { data } = await chatAPI.sendMessage(input, selectedDoc || undefined);
      setMessages((prev) => [...prev, { role: 'assistant', content: data.data.answer }]);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Chat failed');
      setMessages((prev) => prev.slice(0, -1));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-12rem)] animate-fade-in pb-16 md:pb-0">
      <div className="mb-4">
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <MessageSquare className="w-8 h-8 text-primary-600" />
          AI Chat with Documents
        </h1>
        <select
          className="input-field mt-3 max-w-md"
          value={selectedDoc}
          onChange={(e) => { setSelectedDoc(e.target.value); setMessages([]); }}
        >
          <option value="">All documents (cross-document search)</option>
          {documents.map((d) => (
            <option key={d._id} value={d._id}>{d.originalName}</option>
          ))}
        </select>
      </div>

      <div className="card flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-gray-400 py-12">
              <Bot className="w-16 h-16 mb-4 opacity-30" />
              <p className="text-center max-w-md">
                Ask questions about your uploaded documents. Select a specific document or search across all files.
              </p>
              <div className="flex flex-wrap gap-2 mt-6 justify-center">
                {['What are the key insights?', 'Summarize this document', 'What action items are listed?', 'Who are the main entities mentioned?'].map((q) => (
                  <button
                    key={q}
                    onClick={() => setInput(q)}
                    className="text-xs px-3 py-1.5 rounded-full bg-gray-100 dark:bg-gray-800 hover:bg-primary-100 dark:hover:bg-primary-900/30 transition-colors"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}
          {messages.map((msg, i) => (
            <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : ''}`}>
              {msg.role === 'assistant' && (
                <div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center shrink-0">
                  <Bot className="w-4 h-4 text-primary-600" />
                </div>
              )}
              <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                msg.role === 'user'
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-800'
              }`}>
                {msg.role === 'assistant' ? (
                  <ReactMarkdown className="prose prose-sm dark:prose-invert max-w-none">{msg.content}</ReactMarkdown>
                ) : (
                  <p className="text-sm">{msg.content}</p>
                )}
              </div>
              {msg.role === 'user' && (
                <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center shrink-0">
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>
          ))}
          {loading && (
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center">
                <Bot className="w-4 h-4 text-primary-600" />
              </div>
              <LoadingSpinner size="sm" text="Thinking..." />
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        <form onSubmit={sendMessage} className="p-4 border-t border-gray-200 dark:border-gray-800 flex gap-3">
          <input
            className="input-field flex-1"
            placeholder="Ask a question about your documents..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={loading}
          />
          <button type="submit" className="btn-primary px-4" disabled={loading || !input.trim()}>
            <Send className="w-5 h-5" />
          </button>
        </form>
      </div>
    </div>
  );
}
