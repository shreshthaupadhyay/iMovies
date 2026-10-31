require('dotenv').config();
const express = require('express');
const http = require('http');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const { Server } = require('socket.io');

const { connectDB, disconnectDB, getDbInfo } = require('./config/db');
const seedDatabase = require('./seed/seedRunner');
const logger = require('./utils/logger');
const errorHandler = require('./middleware/errorHandler');
const { globalLimiter } = require('./middleware/rateLimiter');
const initSeatSocket = require('./sockets/seatSocket');
const { startSeatCleanupJob, stopSeatCleanupJob } = require('./services/seatLockService');

// Route Imports
const authRoutes = require('./routes/authRoutes');
const movieRoutes = require('./routes/movieRoutes');
const theatreRoutes = require('./routes/theatreRoutes');
const showRoutes = require('./routes/showRoutes');
const bookingRoutes = require('./routes/bookingRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const adminRoutes = require('./routes/adminRoutes');

const app = express();
const server = http.createServer(app);

// Socket.io Setup
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

app.set('io', io);
initSeatSocket(io);

// Security & Parsing Middleware
app.use(
  helmet({
    crossOriginResourcePolicy: false,
  })
);
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logging
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('combined', { stream: logger.accessLogStream }));
  app.use(morgan('dev'));
}

// Rate Limiting
app.use(globalLimiter);

// Static uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Health check & System Info
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    app: 'IMovies API',
    version: '1.0.0',
    database: getDbInfo(),
    timestamp: new Date().toISOString(),
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/movies', movieRoutes);
app.use('/api/theatres', theatreRoutes);
app.use('/api/shows', showRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/admin', adminRoutes);

// Centralized Error Handling
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await connectDB();
    await seedDatabase();
    startSeatCleanupJob(io);

    if (process.env.NODE_ENV !== 'test') {
      server.listen(PORT, () => {
        logger.info(`=======================================================`);
        logger.info(`🎬  IMovies Cinema Ticket Booking API Server Online!`);
        logger.info(`🚀  Running at: http://localhost:${PORT}`);
        logger.info(`⚡  Environment: ${process.env.NODE_ENV || 'development'}`);
        logger.info(`=======================================================`);
      });
    }
  } catch (err) {
    logger.error(`[SERVER] Startup failure: ${err.message}`);
    process.exit(1);
  }
};

if (require.main === module) {
  startServer();
}

// Graceful Shutdown
process.on('SIGINT', async () => {
  logger.info('[SERVER] Gracefully shutting down...');
  stopSeatCleanupJob();
  await disconnectDB();
  process.exit(0);
});

module.exports = { app, server, startServer };
