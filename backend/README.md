<div align="center">

# Real-Time Collaborative Note-Taking App

### Advanced Backend API for Real-Time Collaborative Note-Taking

[![Node.js](https://img.shields.io/badge/Node.js-20+-green.svg)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5+-blue.svg)](https://www.typescriptlang.org/)
[![Express.js](https://img.shields.io/badge/Express.js-4-000000.svg)](https://expressjs.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791.svg)](https://www.postgresql.org/)
[![Socket.io](https://img.sh.shields.io/badge/Socket.io-4-010101.svg)](https://socket.io/)
[![License](https://img.shields.io/badge/License-ISC-yellow.svg)](LICENSE)

[![GitHub stars](https://img.shields.io/github/stars/Mahnoor-fatima249/Real-Time-Collaborative-Note-Taking-App.svg)](https://github.com/Mahnoor-fatima249/Real-Time-Collaborative-Note-Taking-App/stargazers)
[![GitHub forks](https://img.shields.io/github/forks/Mahnoor-fatima249/Real-Time-Collaborative-Note-Taking-App.svg)](https://github.com/Mahnoor-fatima249/Real-Time-Collaborative-Note-Taking-App/network/members)

---

A production-ready, scalable backend for building real-time collaborative note-taking applications like Google Docs / Notion. Features include real-time editing, version history, sharing permissions, OAuth2 authentication, and more.

</div>

## Features

### Authentication & Security
- JWT-based authentication with access & refresh tokens
- OAuth2 integration (Google, GitHub)
- Role-based access control (User, Moderator, Admin)
- Secure password hashing with bcryptjs
- Token blacklisting for secure logout
- Rate limiting & brute force protection
- Helmet security headers
- CORS configuration
- HPP (HTTP Parameter Pollution) protection

### Real-Time Collaboration
- WebSocket-based real-time editing with Socket.io
- Multi-user cursor tracking and presence indicators
- Live typing indicators
- Section locking for collaborative editing
- Automatic conflict resolution with debounced saves
- Redis pub/sub for scaling across instances

### Note Management
- Full CRUD operations for notes
- Rich text content (JSON-based, Quill Delta compatible)
- Version history with restore capability
- Soft delete with trash/restore
- Pin, archive, and organize notes
- Tag-based categorization
- Color coding and cover images
- Word count & character count tracking

### Sharing & Permissions
- Share notes with specific users via email
- Granular permissions (read, write, admin)
- Public notes for anonymous access
- Share link management

### Search & Organization
- Full-text search across notes (title + content)
- Tag-based filtering
- Sort by date, title, custom order
- Pagination support with configurable limits

### Performance & Monitoring
- Redis caching with automatic invalidation
- Database connection pooling
- Winston logger with file rotation
- Request/response logging
- Health check endpoints
- Graceful shutdown handling

---

## Tech Stack

| Component | Technology |
|-----------|------------|
| Runtime | Node.js 20+ |
| Language | TypeScript 5+ |
| Framework | Express.js 4 |
| Database | PostgreSQL 16 (Prod) / SQLite (Dev) |
| ORM | Sequelize 6 |
| Cache | Redis 7 (Prod) / In-Memory (Dev) |
| Real-time | Socket.io 4 |
| Auth | JWT + Passport.js |
| Validation | express-validator |
| Security | Helmet, CORS, Rate Limiting |
| Logging | Winston |
| Containerization | Docker + Docker Compose |

---

## Project Structure

```
backend/
├── src/
│   ├── config/              # Configuration
│   │   ├── index.ts         # Environment variables
│   │   ├── database.ts      # PostgreSQL/SQLite connection
│   │   ├── redis.ts         # Redis/In-Memory cache
│   │   └── passport.ts      # OAuth strategies (Google, GitHub)
│   ├── controllers/         # Request handlers
│   │   ├── auth.controller.ts
│   │   └── note.controller.ts
│   ├── middleware/           # Express middleware
│   │   ├── auth.ts          # JWT authentication
│   │   ├── errorHandler.ts  # Global error handling
│   │   ├── security.ts      # Rate limiting, CORS, Helmet
│   │   └── validation.ts    # Request validation
│   ├── models/              # Database models
│   │   ├── User.ts          # User model
│   │   ├── Note.ts          # Note model
│   │   ├── NoteShare.ts     # Sharing permissions
│   │   ├── NoteVersion.ts   # Version history
│   │   ├── Comment.ts       # Comments/annotations
│   │   ├── RefreshToken.ts  # Refresh tokens
│   │   └── index.ts         # Model associations
│   ├── routes/              # API routes
│   │   ├── auth.routes.ts   # Auth endpoints
│   │   ├── note.routes.ts   # Note endpoints
│   │   └── index.ts         # Route aggregator
│   ├── services/            # Business logic
│   │   ├── auth.service.ts  # Auth operations
│   │   └── note.service.ts  # Note operations
│   ├── socket/              # WebSocket handlers
│   │   └── collaboration.ts # Real-time collaboration
│   ├── types/               # TypeScript definitions
│   │   ├── index.ts         # Type definitions
│   │   └── hpp.d.ts         # HPP type declaration
│   ├── utils/               # Utilities
│   │   ├── AppError.ts      # Custom error classes
│   │   ├── logger.ts        # Winston logger
│   │   └── response.ts      # API response helpers
│   └── index.ts             # Application entry point
├── Dockerfile               # Docker build
├── docker-compose.yml       # Docker services
├── tsconfig.json            # TypeScript config
└── package.json             # Dependencies
```

---

## Getting Started

### Prerequisites

- **Node.js** 20+ ([Download](https://nodejs.org/))
- **PostgreSQL** 16+ ([Download](https://www.postgresql.org/download/)) - for production
- **Redis** 7+ ([Download](https://redis.io/download)) - for production
- **Git** ([Download](https://git-scm.com/))

> For development, SQLite and in-memory cache are used automatically - no PostgreSQL/Redis needed!

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/Mahnoor-fatima249/Real-Time-Collaborative-Note-Taking-App.git
cd Real-Time-Collaborative-Note-Taking-App/backend

# 2. Install dependencies
npm install

# 3. Create environment file
cp .env.example .env

# 4. Edit .env with your configuration
```

### Environment Variables

Create a `.env` file in the backend directory:

```env
# Server
PORT=5000
NODE_ENV=development
API_VERSION=v1

# Database (PostgreSQL - Production)
DB_HOST=localhost
DB_PORT=5432
DB_NAME=collab_notes
DB_USER=postgres
DB_PASSWORD=postgres

# Redis (Production)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# JWT Secrets (CHANGE THESE IN PRODUCTION!)
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=15m
JWT_REFRESH_SECRET=your-refresh-secret-key
JWT_REFRESH_EXPIRES_IN=7d

# OAuth - Google
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_CALLBACK_URL=http://localhost:5000/api/v1/auth/google/callback

# OAuth - GitHub
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret
GITHUB_CALLBACK_URL=http://localhost:5000/api/v1/auth/github/callback

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:3000

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

---

## Running the Server

### Development Mode (No PostgreSQL/Redis Required!)

```bash
npm run dev

# Server starts at http://localhost:5000
# Uses SQLite (database.sqlite) + In-Memory Cache automatically
```

### Production Mode

```bash
# Build TypeScript
npm run build

# Start production server
npm start
```

### Docker

```bash
# Start all services (PostgreSQL + Redis + App)
docker-compose up -d

# View logs
docker-compose logs -f

# Stop all services
docker-compose down
```

---

## API Endpoints

### Base URL: `http://localhost:5000/api/v1`

### Authentication

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/v1` | API documentation | No |
| GET | `/api/v1/health` | Health check | No |
| POST | `/api/v1/auth/register` | Register new user | No |
| POST | `/api/v1/auth/login` | Login | No |
| POST | `/api/v1/auth/refresh` | Refresh access token | No |
| GET | `/api/v1/auth/google` | Google OAuth login | No |
| GET | `/api/v1/auth/github` | GitHub OAuth login | No |
| POST | `/api/v1/auth/logout` | Logout (blacklist token) | Yes |
| GET | `/api/v1/auth/profile` | Get user profile | Yes |
| PUT | `/api/v1/auth/profile` | Update profile | Yes |
| PUT | `/api/v1/auth/change-password` | Change password | Yes |

### Notes

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/v1/notes` | Create new note | Yes |
| GET | `/api/v1/notes` | Get all notes (with pagination) | Yes |
| GET | `/api/v1/notes/:id` | Get note by ID | Yes |
| PUT | `/api/v1/notes/:id` | Update note | Yes |
| DELETE | `/api/v1/notes/:id` | Soft delete note | Yes |
| POST | `/api/v1/notes/:id/restore` | Restore deleted note | Yes |
| GET | `/api/v1/notes/:id/versions` | Get version history | Yes |
| POST | `/api/v1/notes/:id/versions/:v/restore` | Restore specific version | Yes |
| POST | `/api/v1/notes/:id/share` | Share note with user | Yes |
| DELETE | `/api/v1/notes/:id/share/:userId` | Remove share | Yes |
| GET | `/api/v1/notes/shared` | Get notes shared with me | Yes |
| GET | `/api/v1/notes/deleted` | Get deleted notes (trash) | Yes |
| DELETE | `/api/v1/notes/:id/permanent` | Permanently delete | Yes |

---

## API Usage Examples

### Register a New User

```bash
curl -X POST http://localhost:5000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "password123",
    "username": "john",
    "displayName": "John Doe"
  }'
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid-here",
      "email": "john@example.com",
      "username": "john",
      "displayName": "John Doe",
      "role": "user"
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "expiresIn": "15m"
  }
}
```

### Create a Note

```bash
curl -X POST http://localhost:5000/api/v1/notes \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "title": "My First Note",
    "plainText": "This is the content of my note.",
    "tags": ["important", "work"],
    "color": "#4ECDC4"
  }'
```

### Share a Note

```bash
curl -X POST http://localhost:5000/api/v1/notes/NOTE_ID/share \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "email": "colleague@example.com",
    "permission": "write"
  }'
```

---

## WebSocket Events

### Connecting

```javascript
import { io } from "socket.io-client";

const socket = io("http://localhost:5000", {
  auth: {
    token: "YOUR_JWT_TOKEN"
  }
});
```

### Client → Server Events

| Event | Payload | Description |
|-------|---------|-------------|
| `join-note` | `noteId: string` | Join a note editing room |
| `leave-note` | `noteId: string` | Leave a note room |
| `content-change` | `{noteId, delta, version, cursor}` | Content was edited |
| `cursor-update` | `{noteId, cursor}` | Cursor position changed |
| `title-change` | `{noteId, title}` | Title was changed |
| `selection-change` | `{noteId, selection}` | Text selection changed |
| `typing-start` | `noteId: string` | User started typing |
| `typing-stop` | `noteId: string` | User stopped typing |
| `lock-section` | `{noteId, section}` | Lock a section |
| `unlock-section` | `{noteId, section}` | Unlock a section |

### Server → Client Events

| Event | Payload | Description |
|-------|---------|-------------|
| `note-joined` | `{note, users, yourUser}` | Successfully joined note |
| `user-joined` | `{user, users}` | Another user joined |
| `user-left` | `{userId, users}` | A user left |
| `remote-change` | `{userId, delta, version, cursor}` | Remote edit received |
| `remote-cursor` | `{userId, cursor}` | Remote cursor position |
| `remote-title-change` | `{userId, title}` | Remote title change |
| `user-typing` | `{userId, isTyping}` | Typing indicator |
| `section-locked` | `{userId, section}` | Section locked |
| `section-unlocked` | `{userId, section}` | Section unlocked |
| `error` | `{message}` | Error occurred |

### Example: Real-Time Collaboration

```javascript
const socket = io("http://localhost:5000", {
  auth: { token: "YOUR_JWT_TOKEN" }
});

// Join a note room
socket.emit("join-note", "note-uuid-here");

// Listen for remote changes
socket.on("remote-change", (data) => {
  console.log(`User ${data.userId} made changes`);
  applyDelta(data.delta);
});

// Send local changes
socket.emit("content-change", {
  noteId: "note-uuid-here",
  delta: { ops: [{ insert: "Hello World" }] },
  version: 2,
  cursor: { position: 11 }
});

// Listen for users joining/leaving
socket.on("user-joined", (data) => {
  console.log(`${data.user.displayName} joined the note`);
  updatePresence(data.users);
});
```

---

## Database Schema

### Users Table
```
id (UUID, PK) | email (VARCHAR, UNIQUE) | password (VARCHAR) 
username (VARCHAR, UNIQUE) | display_name (VARCHAR) | avatar (VARCHAR)
provider (ENUM) | provider_id (VARCHAR) | is_email_verified (BOOLEAN)
role (ENUM) | status (ENUM) | last_login_at (TIMESTAMP)
created_at | updated_at
```

### Notes Table
```
id (UUID, PK) | title (VARCHAR) | content (JSONB) 
plain_text (TEXT) | owner_id (UUID, FK) | is_public (BOOLEAN)
is_pinned (BOOLEAN) | is_archived (BOOLEAN) | is_deleted (BOOLEAN)
last_edited_by (UUID, FK) | version (INTEGER) 
word_count (INTEGER) | character_count (INTEGER)
tags (TEXT[]) | color (VARCHAR) | cover_image (VARCHAR)
created_at | updated_at | deleted_at (paranoid)
```

### Note Shares Table
```
id (UUID, PK) | note_id (UUID, FK) | user_id (UUID, FK)
permission (ENUM: read/write/admin) | shared_by (UUID, FK)
is_active (BOOLEAN) | expires_at (TIMESTAMP)
created_at | updated_at
```

### Note Versions Table
```
id (UUID, PK) | note_id (UUID, FK) | version (INTEGER)
title (VARCHAR) | content (JSONB) | plain_text (TEXT)
edited_by (UUID, FK) | change_description (VARCHAR)
created_at | updated_at
```

---

## Architecture

```
                    ┌─────────────────────┐
                    │      Client         │
                    │   (React/Vue/etc)   │
                    └─────────┬───────────┘
                              │
                    ┌─────────▼───────────┐
                    │   Express.js API    │
                    │   (Port 5000)       │
                    └─────────┬───────────┘
                              │
            ┌─────────────────┼─────────────────┐
            │                 │                 │
   ┌────────▼────────┐ ┌─────▼──────┐ ┌───────▼───────┐
   │   PostgreSQL    │ │   Redis    │ │   Socket.io   │
   │   (Database)    │ │  (Cache)   │ │ (WebSocket)   │
   └─────────────────┘ └────────────┘ └───────────────┘
```

---

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server with hot reload |
| `npm run build` | Compile TypeScript to JavaScript |
| `npm start` | Start production server |
| `npm test` | Run test suite |
| `npm run lint` | Run ESLint |
| `npm run format` | Format code with Prettier |

---

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## License

This project is licensed under the ISC License - see the [LICENSE](LICENSE) file for details.

---

<div align="center">

### Built with ❤️ for collaborative note-taking

[![GitHub](https://img.shields.io/badge/GitHub-Repository-181717.svg?style=flat&logo=github)](https://github.com/Mahnoor-fatima249/Real-Time-Collaborative-Note-Taking-App)

</div>
