import app from './app.js';
import { connectDB } from './config/db.js';
import { ensurePineconeIndex } from './services/pinecone.service.js';

const PORT = process.env.PORT || 5001;

const start = async () => {
  try {
    await connectDB();
    await ensurePineconeIndex();
    const server = app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
      console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    });

    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        console.error(`Port ${PORT} is already in use. Set PORT in backend/.env to a free port (e.g. 4000, 5001).`);
      } else {
        console.error('Server error:', err.message);
      }
      process.exit(1);
    });
  } catch (error) {
    console.error('Failed to start server:', error.message);
    process.exit(1);
  }
};

start();
