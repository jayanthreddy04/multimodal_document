import mongoose from 'mongoose';

export const connectDB = async () => {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    throw new Error(
      'MONGODB_URI is missing. Set it to your MongoDB Atlas connection string, for example:\n' +
        'MONGODB_URI=mongodb+srv://<user>:<password>@<cluster>.mongodb.net/document_analyzer'
    );
  }

  try {
    if (mongoose.connection.readyState === 1) return;

    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 8000,
      family: 4,
    });
    console.log(`MongoDB connected (${mongoose.connection.host}/${mongoose.connection.name})`);
  } catch (err) {
    throw new Error(
      `MongoDB connection failed: ${err.message}\n` +
        'Check your Atlas URI, database user password, and Atlas Network Access IP allowlist.'
    );
  }
};

export const isDBConnected = () => mongoose.connection.readyState === 1;
