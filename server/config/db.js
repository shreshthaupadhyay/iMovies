const mongoose = require('mongoose');
const logger = require('../utils/logger');

let mongoMemoryServerInstance = null;
let activeDbType = 'none';

const connectDB = async () => {
  const externalUri = process.env.MONGO_URI ? process.env.MONGO_URI.trim() : '';

  if (externalUri) {
    try {
      logger.info(`[DATABASE] Attempting connection to external MongoDB...`);
      await mongoose.connect(externalUri, {
        serverSelectionTimeoutMS: 3000,
      });
      activeDbType = 'external';
      logger.info(`[DATABASE] Successfully connected to External MongoDB!`);
      return;
    } catch (err) {
      logger.warn(`[DATABASE] External MongoDB connection failed: ${err.message}. Falling back to In-Memory MongoDB.`);
    }
  } else {
    logger.info(`[DATABASE] No MONGO_URI provided in environment. Falling back to In-Memory MongoDB.`);
  }

  try {
    const { MongoMemoryServer } = require('mongodb-memory-server');
    logger.info(`[DATABASE] Initializing MongoMemoryServer (Zero-Setup mode)...`);
    mongoMemoryServerInstance = await MongoMemoryServer.create();
    const memoryUri = mongoMemoryServerInstance.getUri();
    await mongoose.connect(memoryUri);
    activeDbType = 'memory';
    logger.info(`[DATABASE] Successfully connected to In-Memory MongoDB! Database URI: ${memoryUri}`);
  } catch (memErr) {
    logger.error(`[DATABASE] CRITICAL: Failed to initialize In-Memory MongoDB: ${memErr.message}`);
    throw memErr;
  }
};

const disconnectDB = async () => {
  try {
    await mongoose.disconnect();
    if (mongoMemoryServerInstance) {
      await mongoMemoryServerInstance.stop();
      mongoMemoryServerInstance = null;
    }
    logger.info(`[DATABASE] Disconnected from database.`);
  } catch (err) {
    logger.error(`[DATABASE] Error disconnecting from database: ${err.message}`);
  }
};

const getDbInfo = () => ({
  type: activeDbType,
  isConnected: mongoose.connection.readyState === 1,
});

module.exports = {
  connectDB,
  disconnectDB,
  getDbInfo,
};
