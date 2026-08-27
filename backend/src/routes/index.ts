import { Router } from 'express';
import authRoutes from './auth.routes';
import noteRoutes from './note.routes';

const router = Router();

// Root API route
router.get('/', (req, res) => {
  res.json({
    success: true,
    data: {
      name: 'Real-Time Collaborative Note-Taking API',
      version: '1.0.0',
      description: 'Advanced backend for real-time collaborative note-taking',
      endpoints: {
        health: '/api/v1/health',
        auth: {
          register: 'POST /api/v1/auth/register',
          login: 'POST /api/v1/auth/login',
          refresh: 'POST /api/v1/auth/refresh',
          logout: 'POST /api/v1/auth/logout',
          profile: 'GET /api/v1/auth/profile',
          updateProfile: 'PUT /api/v1/auth/profile',
          changePassword: 'PUT /api/v1/auth/change-password',
          googleOAuth: 'GET /api/v1/auth/google',
          githubOAuth: 'GET /api/v1/auth/github',
        },
        notes: {
          create: 'POST /api/v1/notes',
          getAll: 'GET /api/v1/notes',
          getById: 'GET /api/v1/notes/:id',
          update: 'PUT /api/v1/notes/:id',
          delete: 'DELETE /api/v1/notes/:id',
          restore: 'POST /api/v1/notes/:id/restore',
          versions: 'GET /api/v1/notes/:id/versions',
          restoreVersion: 'POST /api/v1/notes/:id/versions/:version/restore',
          share: 'POST /api/v1/notes/:id/share',
          removeShare: 'DELETE /api/v1/notes/:id/share/:userId',
          sharedNotes: 'GET /api/v1/notes/shared',
          deletedNotes: 'GET /api/v1/notes/deleted',
          permanentDelete: 'DELETE /api/v1/notes/:id/permanent',
        },
      },
      websocket: 'ws://localhost:5000',
    },
  });
});

router.use('/auth', authRoutes);
router.use('/notes', noteRoutes);

// Health check
router.get('/health', (req, res) => {
  res.json({
    success: true,
    data: {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    },
  });
});

export default router;
