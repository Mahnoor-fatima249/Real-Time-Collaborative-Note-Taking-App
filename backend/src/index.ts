import express from 'express';
import http from 'http';
import { config } from './config';
import { connectDB } from './config/database';
import { redis } from './config/redis';
import passport from './config/passport';
import routes from './routes';
import { errorHandler, notFound } from './middleware/errorHandler';
import { securityMiddleware, rateLimiter, requestLogger } from './middleware/security';
import { CollaborationManager } from './socket/collaboration';
import { logger } from './utils/logger';

const app = express();
const server = http.createServer(app);

// Initialize collaboration manager
const collaborationManager = new CollaborationManager(server);

// Make collaboration manager available
app.set('collaborationManager', collaborationManager);

// Security middleware
app.use(securityMiddleware);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Cookie parser
app.use(require('cookie-parser')());

// Session configuration
app.use(
  require('express-session')({
    secret: config.jwt.secret,
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: config.nodeEnv === 'production',
      maxAge: 24 * 60 * 60 * 1000,
    },
  })
);

// Passport
app.use(passport.initialize());
app.use(passport.session());

// Request logging
app.use(requestLogger);

// Rate limiting
app.use('/api', rateLimiter);

// API routes
app.use(`/api/${config.apiVersion}`, routes);

// Error handling
app.use(notFound);
app.use(errorHandler);

// Start server
const startServer = async (): Promise<void> => {
  try {
    // Connect to database (SQLite or PostgreSQL)
    await connectDB();

    // Test Redis (or memory cache)
    try {
      await redis.ping();
      logger.info('Cache connected');
    } catch (err) {
      logger.warn('Using in-memory cache');
    }

    // Start server
    server.listen(config.port, () => {
      console.log('');
      console.log('============================================');
      console.log('  Server running in ' + config.nodeEnv + ' mode');
      console.log('  Port: ' + config.port);
      console.log('  API: http://localhost:' + config.port + '/api/' + config.apiVersion);
      console.log('  WebSocket: ws://localhost:' + config.port);
      console.log('  Database: SQLite (dev mode)');
      console.log('  Cache: In-memory (dev mode)');
      console.log('============================================');
      console.log('');
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Graceful shutdown
const gracefulShutdown = async (signal: string): Promise<void> => {
  logger.info(`${signal} received. Starting graceful shutdown...`);

  server.close(async () => {
    try {
      await redis.quit();
    } catch (e) {
      // Ignore
    }
    logger.info('Server closed');
    process.exit(0);
  });

  // Force shutdown after 30 seconds
  setTimeout(() => {
    logger.error('Forced shutdown after timeout');
    process.exit(1);
  }, 30000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught exceptions
process.on('uncaughtException', (error: Error) => {
  logger.error('Uncaught Exception:', error);
  gracefulShutdown('uncaughtException');
});

process.on('unhandledRejection', (reason: any) => {
  logger.error('Unhandled Rejection:', reason);
});

startServer();

export { app, server, collaborationManager };
