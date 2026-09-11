const mongoose = require('mongoose');

let isConnected = false;
let memoryServerInstance = null;

async function connectDB() {
  if (isConnected && mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  const uri = process.env.MONGODB_URI;

  try {
    if (uri && !process.env.FORCE_MEMORY_DB) {
      // Connect to MongoDB Atlas or configured URI with 5s timeout
      await mongoose.connect(uri, {
        serverSelectionTimeoutMS: 4000
      });
      isConnected = true;
      console.log(`[DB] Connected to MongoDB: ${mongoose.connection.host}`);
      return mongoose.connection;
    }
  } catch (err) {
    console.warn(`[DB] Could not connect to configured MongoDB URI (${err.message}).`);
  }

  // Fallback to in-memory MongoDB for seamless zero-setup local dev/test
  if (process.env.NODE_ENV !== 'production') {
    try {
      console.log('[DB] Initializing in-memory MongoDB server for local execution...');
      const { MongoMemoryServer } = require('mongodb-memory-server');
      memoryServerInstance = await MongoMemoryServer.create();
      const memUri = memoryServerInstance.getUri();
      await mongoose.connect(memUri);
      isConnected = true;
      console.log(`[DB] Connected to in-memory MongoDB: ${memUri}`);
      return mongoose.connection;
    } catch (memErr) {
      console.error('[DB] Failed to start in-memory MongoDB:', memErr.message);
      throw memErr;
    }
  }

  throw new Error('Could not establish database connection in production environment.');
}

async function closeDB() {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
  if (memoryServerInstance) {
    await memoryServerInstance.stop();
  }
  isConnected = false;
}

module.exports = { connectDB, closeDB };
