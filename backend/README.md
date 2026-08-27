# Real-Time Collaborative Note-Taking App - Backend

Advanced backend for a real-time collaborative note-taking application built with Node.js, TypeScript, PostgreSQL, Redis, and Socket.io.

## Features

### Authentication & Authorization
- JWT-based authentication with access & refresh tokens
- OAuth2 integration (Google, GitHub)
- Role-based access control (User, Moderator, Admin)
- Secure password hashing with bcrypt
- Token blacklisting for logout

### Real-Time Collaboration
- WebSocket-based real-time editing with Socket.io
- Cursor tracking and presence indicators
- Live typing indicators
- Section locking for collaborative editing
- Automatic conflict resolution

### Note Management
- Full CRUD operations for notes
- Rich text content with JSON storage
- Version history with restore capability
- Soft delete with trash/restore
- Pin, archive, and organize notes
- Tag-based categorization
- Color coding and cover images

### Sharing & Permissions
- Share notes with specific users
- Granular permissions (read, write, admin)
- Public notes for anonymous access
- Share link management

### Search & Organization
- Full-text search across notes
- Tag-based filtering
- Sort by date, title
- Pagination support

### Security & Performance
- Rate limiting per IP and route
- CORS configuration
- Helmet security headers
- HPP (HTTP Parameter Pollution) protection
- Response compression
- Redis caching
- Database connection pooling

### Logging & Monitoring
- Winston logger with file rotation
- Request/response logging
- Error tracking with stack traces
- Health check endpoints
- Collaboration statistics

## Tech Stack

- **Runtime**: Node.js 20+
- **Language**: TypeScript 5+
- **Framework**: Express.js 4
- **Database**: PostgreSQL 16 with Sequelize ORM
- **Cache**: Redis 7
- **Real-time**: Socket.io 4
- **Auth**: JWT + Passport.js
- **Security**: Helmet, CORS, Rate Limiting

## Project Structure

```
backend/
├── src/
│   ├── config/           # Configuration files
│   │   ├── index.ts      # Environment config
│   │   ├── database.ts   # PostgreSQL connection
│   │   ├── redis.ts      # Redis connection & cache
│   │   └── passport.ts   # OAuth strategies
│   ├── controllers/      # Request handlers
│   │   ├── auth.controller.ts
│   │   └── note.controller.ts
│   ├── middleware/        # Express middleware
│   │   ├── auth.ts       # JWT authentication
│   │   ├── errorHandler.ts
│   │   ├── security.ts   # Rate limiting, CORS, etc.
│   │   └── validation.ts # Request validation
│   ├── models/           # Sequelize models
│   │   ├── User.ts
│   │   ├── Note.ts
│   │   ├── NoteShare.ts
│   │   ├── NoteVersion.ts
│   │   ├── Comment.ts
│   │   ├── RefreshToken.ts
│   │   └── index.ts      # Associations
│   ├── routes/           # API routes
│   │   ├── auth.routes.ts
│   │   ├── note.routes.ts
│   │   └── index.ts
│   ├── services/         # Business logic
│   │   ├── auth.service.ts
│   │   └── note.service.ts
│   ├── socket/           # WebSocket handlers
│   │   └── collaboration.ts
│   ├── types/            # TypeScript types
│   │   └── index.ts
│   ├── utils/            # Utilities
│   │   ├── AppError.ts
│   │   ├── logger.ts
│   │   └── response.ts
│   └── index.ts          # Entry point
├── Dockerfile
├── docker-compose.yml
├── tsconfig.json
└── package.json
```

## Getting Started

### Prerequisites

- Node.js 20+
- PostgreSQL 16+
- Redis 7+

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd backend

# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Configure .env with your settings
```

### Development

```bash
# Start development server
npm run dev

# The server will start at http://localhost:5000
```

### Docker

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### Production

```bash
# Build TypeScript
npm run build

# Start production server
npm start
```

## API Endpoints

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/v1/auth/register | Register new user |
| POST | /api/v1/auth/login | Login |
| POST | /api/v1/auth/refresh | Refresh tokens |
| POST | /api/v1/auth/logout | Logout |
| GET | /api/v1/auth/google | Google OAuth |
| GET | /api/v1/auth/github | GitHub OAuth |
| GET | /api/v1/auth/profile | Get profile |
| PUT | /api/v1/auth/profile | Update profile |
| PUT | /api/v1/auth/change-password | Change password |

### Notes

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/v1/notes | Create note |
| GET | /api/v1/notes | Get all notes |
| GET | /api/v1/notes/:id | Get note by ID |
| PUT | /api/v1/notes/:id | Update note |
| DELETE | /api/v1/notes/:id | Delete note |
| POST | /api/v1/notes/:id/restore | Restore note |
| GET | /api/v1/notes/:id/versions | Get versions |
| POST | /api/v1/notes/:id/versions/:version/restore | Restore version |
| POST | /api/v1/notes/:id/share | Share note |
| DELETE | /api/v1/notes/:id/share/:userId | Remove share |
| GET | /api/v1/notes/shared | Get shared notes |
| GET | /api/v1/notes/deleted | Get deleted notes |
| DELETE | /api/v1/notes/:id/permanent | Permanent delete |

### Health Check

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/v1/health | Health check |

## WebSocket Events

### Client -> Server

| Event | Description |
|-------|-------------|
| join-note | Join a note room |
| leave-note | Leave a note room |
| content-change | Content changed |
| cursor-update | Cursor position updated |
| title-change | Title changed |
| selection-change | Text selection changed |
| typing-start | User started typing |
| typing-stop | User stopped typing |
| lock-section | Lock a section |
| unlock-section | Unlock a section |

### Server -> Client

| Event | Description |
|-------|-------------|
| note-joined | Successfully joined note |
| user-joined | User joined the note |
| user-left | User left the note |
| remote-change | Remote content change |
| remote-cursor | Remote cursor update |
| remote-title-change | Remote title change |
| remote-selection | Remote selection change |
| user-typing | User typing indicator |
| section-locked | Section locked by user |
| section-unlocked | Section unlocked |
| error | Error occurred |

## Environment Variables

See `.env.example` for all required environment variables.

## License

ISC
