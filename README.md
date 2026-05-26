# Multimodal Document Analyzer

AI-powered full-stack application for uploading, analyzing, and interacting with documents and media. Built with **React (Vite)**, **Node.js/Express**, **Groq AI**, **Pinecone**, **MongoDB**, and **Tesseract OCR**.

![Stack](https://img.shields.io/badge/React-18-blue) ![Stack](https://img.shields.io/badge/Express-4-green) ![Stack](https://img.shields.io/badge/Groq-AI-orange) ![Stack](https://img.shields.io/badge/Pinecone-Vector-purple)

## Features

- **Multi-format upload** — PDF, DOCX, TXT, PNG, JPG/JPEG (drag & drop)
- **OCR** — Scanned docs & images via Tesseract.js (8+ languages)
- **AI analysis** — Summaries, insights, entities, sentiment, action items (Groq)
- **Document chat** — RAG-powered Q&A about your files
- **Semantic search** — Natural language search via Pinecone vectors
- **Insights dashboard** — Charts, confidence scores, highlights, exports
- **Document history** — Filter, search, categorize, duplicate detection
- **Auth** — JWT login/register with protected routes
- **Dark/light mode** — Responsive UI with Tailwind CSS

## Project Structure

```
multimodal_document_analyzer/
├── backend/                 # Express API
│   ├── src/
│   │   ├── config/          # DB, Groq, Pinecone
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── services/        # OCR, parsing, AI, vectors
│   │   └── utils/
│   └── uploads/
├── frontend/                # React + Vite + Tailwind
│   └── src/
│       ├── components/
│       ├── context/
│       ├── pages/
│       ├── services/
│       └── store/
└── README.md
```

## Prerequisites

- Node.js 18+
- MongoDB (local or Atlas)
- [Groq API key](https://console.groq.com)
- [Pinecone API key](https://app.pinecone.io) (optional but recommended for semantic search)

## Quick Start

### 1. Clone & install

```bash
cd multimodal_document_analyzer
npm run install:all
```

### 2. Backend environment

```bash
cp backend/.env.example backend/.env
```

Edit `backend/.env`:

```env
PORT=5001
MONGODB_URI=mongodb://localhost:27017/document_analyzer
JWT_SECRET=your_secret_key_here
GROQ_API_KEY=gsk_your_groq_key
LANGSMITH_TRACING=true
LANGSMITH_API_KEY=lsv2_your_langsmith_key
LANGSMITH_PROJECT=multimodal-document-analyzer
PINECONE_API_KEY=your_pinecone_key
PINECONE_INDEX_NAME=document-analyzer
PINECONE_DIMENSION=768
FRONTEND_URL=http://localhost:5174
```

LangSmith tracing is enabled when `LANGSMITH_TRACING=true` and `LANGSMITH_API_KEY` is set. If your LangSmith workspace is not in the default US region, also set `LANGSMITH_ENDPOINT` to your regional API endpoint. Large document text is previewed in traces by default; set `LANGSMITH_TRACE_FULL_INPUTS=true` only if you are comfortable sending full document prompts/content to LangSmith.

### 3. Frontend environment

```bash
cp frontend/.env.example frontend/.env
```

```env
VITE_API_URL=http://localhost:5001/api
```

### 4. Create Pinecone index (one-time)

```bash
cd backend && node scripts/setup-pinecone.js
```

### 5. Start MongoDB & run apps

```bash
# Terminal 1 — API (port 5001 — avoids macOS AirPlay on 5000)
npm run dev:backend

# Terminal 2 — UI (port 5174)
npm run dev:frontend
```

Open **http://localhost:5174** → Register → Upload a document.

> **Port conflict?** On macOS, port **5000** is often used by AirPlay. This project uses **5001** for the API. If you still see `EADDRINUSE`, stop other Node processes (`lsof -i :5001`) or set a different `PORT` in `backend/.env`.

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register user |
| POST | `/api/auth/login` | Login, get JWT |
| GET | `/api/auth/me` | Current user |
| POST | `/api/upload` | Upload file (multipart `file`) |
| POST | `/api/analyze/:id` | Analyze document with AI |
| GET | `/api/history` | List documents |
| GET | `/api/documents/:id` | Get document details |
| GET | `/api/documents/:id/status` | Processing status |
| POST | `/api/documents/:id/ocr` | Run OCR |
| GET | `/api/documents/:id/export` | Download report |
| DELETE | `/api/documents/:id` | Delete document |
| POST | `/api/chat` | Chat with document(s) |
| POST | `/api/search` | Semantic search |
| GET | `/api/health` | Health check |

### API Testing Examples (curl)

```bash
# Register
curl -X POST http://localhost:5001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Demo User","email":"demo@test.com","password":"demo1234"}'

# Login
TOKEN=$(curl -s -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"demo@test.com","password":"demo1234"}' | jq -r '.data.token')

# Upload
curl -X POST http://localhost:5001/api/upload \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@./sample.pdf"

# Analyze (replace DOC_ID)
curl -X POST http://localhost:5001/api/analyze/DOC_ID \
  -H "Authorization: Bearer $TOKEN"

# Chat
curl -X POST http://localhost:5001/api/chat \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"message":"What are the key insights?","documentId":"DOC_ID"}'

# Semantic search
curl -X POST http://localhost:5001/api/search \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"query":"invoice payment terms"}'
```

## Deployment

### Full-stack — Vercel

1. Push repo to GitHub
2. Import project in [Vercel](https://vercel.com)
3. Keep the root directory as the repository root, not `frontend`
4. Vercel will use the root `vercel.json`:
   - frontend build: `npm run build:frontend`
   - output: `frontend/dist`
   - API function: `api/index.js`
   - API routes: `/api/*`
5. Add the environment variables below in Vercel Project Settings
5. Deploy

For a same-domain Vercel deploy, leave `VITE_API_URL` unset or set it to `/api`.
If you deploy the backend somewhere else, set `VITE_API_URL=https://your-api-domain.com/api`.

> Vercel note: this backend currently stores uploaded files on local temporary disk. Vercel can run the API, but uploaded files are not durable across serverless invocations. For production, move file storage to S3, Cloudinary, UploadThing, or MongoDB GridFS before relying on document re-processing later.

### Vercel environment variables

Backend:

```env
NODE_ENV=production
MONGODB_URI=mongodb+srv://<user>:<password>@<cluster>.mongodb.net/document_analyzer?retryWrites=true&w=majority
JWT_SECRET=use_a_long_random_secret
JWT_EXPIRES_IN=7d
GROQ_API_KEY=gsk_your_groq_key
GROQ_MODEL=llama-3.3-70b-versatile
LANGSMITH_TRACING=true
LANGSMITH_API_KEY=lsv2_your_langsmith_key
LANGSMITH_PROJECT=multimodal-document-analyzer
PINECONE_API_KEY=your_pinecone_key
PINECONE_INDEX_NAME=document-analyzer
PINECONE_DIMENSION=768
MAX_FILE_SIZE_MB=10
FRONTEND_URL=https://your-vercel-project.vercel.app
```

Frontend:

```env
VITE_API_URL=/api
```

### Backend — Render / Railway

**Render:**
1. New Web Service → connect repo
2. Root: `backend`, Build: `npm install`, Start: `npm start`
3. Add env vars from `.env.example`
4. Set `FRONTEND_URL` to your Vercel URL

**Railway:**
1. New project from GitHub
2. Set service root to `backend`
3. Add MongoDB plugin or use Atlas URI
4. Configure environment variables

### MongoDB Atlas

1. Create free cluster at [mongodb.com/atlas](https://www.mongodb.com/atlas)
2. Create a database user and password
3. In Network Access, add your allowed IPs. For Vercel serverless, use `0.0.0.0/0` for quick setup, then tighten it later if your plan/networking supports it
4. Copy the Node.js connection string to `MONGODB_URI`
5. Replace `<password>` and set the database name, for example:

```env
MONGODB_URI=mongodb+srv://app_user:<password>@cluster0.xxxxx.mongodb.net/document_analyzer?retryWrites=true&w=majority
```

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18, Vite, Tailwind CSS, Redux Toolkit, React Router |
| Backend | Node.js, Express, Multer, Helmet, Rate Limiting |
| AI | Groq API (Llama 3.3 70B) |
| Vector DB | Pinecone + LangChain text splitters |
| OCR | Tesseract.js + Sharp |
| Parsing | pdf-parse, mammoth |
| Database | MongoDB + Mongoose |
| Auth | JWT + bcrypt |

## Scalability & Best Practices

- **Chunked embeddings** — Documents split for efficient RAG retrieval
- **Rate limiting** — Per-route limits on auth, upload, and API
- **Async processing** — Non-blocking analyze pipeline with status polling
- **Graceful fallbacks** — Text search when Pinecone is unavailable
- **Modular services** — Swap AI/vector providers without touching routes
- **Environment-based config** — All secrets in `.env`, never committed

## Troubleshooting

| Issue | Solution |
|-------|----------|
| `GROQ_API_KEY` error | Add key to `backend/.env` |
| MongoDB connection failed | Start local MongoDB or fix Atlas URI |
| Pinecone errors | Run setup script; verify index name & dimension (768) |
| OCR slow on large images | Pre-process with Sharp (built-in) or reduce file size |
| CORS errors | Set `FRONTEND_URL` to exact frontend origin |

## License

MIT — Free for portfolio and educational use.
