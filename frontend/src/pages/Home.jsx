import { Link } from 'react-router-dom';
import {
  Upload, ScanText, MessageSquare, BarChart3, Search, History,
  FileText, Zap, Shield, Globe,
} from 'lucide-react';

const features = [
  { icon: Upload, title: 'Multi-Format Upload', desc: 'PDF, DOCX, TXT, images, scans, invoices, resumes & more', path: '/upload', color: 'from-blue-500 to-cyan-500' },
  { icon: ScanText, title: 'OCR Engine', desc: 'Extract text from scanned docs with multilingual support', path: '/ocr', color: 'from-green-500 to-emerald-500' },
  { icon: MessageSquare, title: 'AI Document Chat', desc: 'Ask questions and get contextual answers powered by Groq', path: '/chat', color: 'from-purple-500 to-pink-500' },
  { icon: BarChart3, title: 'Insights Dashboard', desc: 'Summaries, entities, sentiment, action items & highlights', path: '/insights', color: 'from-orange-500 to-red-500' },
  { icon: Search, title: 'Semantic Search', desc: 'Natural language search across all your documents via Pinecone', path: '/search', color: 'from-indigo-500 to-violet-500' },
  { icon: History, title: 'Document History', desc: 'Revisit, manage, and export previously analyzed files', path: '/history', color: 'from-teal-500 to-green-500' },
];

const stats = [
  { icon: FileText, label: 'File Formats', value: '6+' },
  { icon: Zap, label: 'AI Provider', value: 'Groq' },
  { icon: Shield, label: 'Auth', value: 'JWT' },
  { icon: Globe, label: 'OCR Languages', value: '8+' },
];

export default function Home() {
  return (
    <div className="space-y-12 animate-fade-in pb-16 md:pb-0">
      <section className="text-center space-y-6 py-8">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 text-sm font-medium">
          <Zap className="w-4 h-4" />
          AI-Powered Document Intelligence
        </div>
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight">
          <span className="bg-gradient-to-r from-primary-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
            Multimodal Document
          </span>
          <br />
          Analyzer
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
          Upload, analyze, and interact with any document type. Extract insights,
          run OCR, chat with your files, and search semantically — all powered by Groq AI.
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          <Link to="/upload" className="btn-primary text-base px-6 py-3">
            Get Started
          </Link>
          <Link to="/search" className="btn-secondary text-base px-6 py-3">
            Search Documents
          </Link>
        </div>
      </section>

      <section className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {stats.map(({ icon: Icon, label, value }) => (
          <div key={label} className="card text-center py-4">
            <Icon className="w-6 h-6 text-primary-600 mx-auto mb-2" />
            <p className="text-2xl font-bold">{value}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
          </div>
        ))}
      </section>

      <section>
        <h2 className="text-2xl font-bold mb-6 text-center">Features</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map(({ icon: Icon, title, desc, path, color }) => (
            <Link key={path} to={path} className="card group hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                <Icon className="w-6 h-6 text-white" />
              </div>
              <h3 className="font-semibold text-lg mb-2">{title}</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">{desc}</p>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
