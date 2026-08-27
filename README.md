<div align="center">

# Real-Time Collaborative Note-Taking App

### A Full-Stack Real-Time Collaborative Note-Taking Application

[![Node.js](https://img.shields.io/badge/Node.js-20+-green.svg)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5+-blue.svg)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/License-ISC-yellow.svg)](LICENSE)

---

Build real-time collaborative notes like Google Docs / Notion

</div>

## About

This is a production-ready backend for building real-time collaborative note-taking applications. Multiple users can edit the same note simultaneously with live cursor tracking, typing indicators, and automatic conflict resolution.

## Features

- **Real-Time Collaboration** - Multiple users editing same note simultaneously
- **JWT Authentication** - Secure login with access & refresh tokens
- **OAuth2** - Login with Google and GitHub
- **Version History** - Track changes and restore previous versions
- **Sharing** - Share notes with read/write/admin permissions
- **Soft Delete** - Trash and restore deleted notes
- **Search** - Full-text search across all notes
- **Tags & Colors** - Organize notes with tags and color coding
- **Rate Limiting** - Protection against abuse
- **Docker** - One-command deployment

## Quick Start

```bash
# Clone
git clone https://github.com/Mahnoor-fatima249/Real-Time-Collaborative-Note-Taking-App.git
cd Real-Time-Collaborative-Note-Taking-App/backend

# Install
npm install

# Run (Development - No PostgreSQL/Redis needed!)
npm run dev
```

Server starts at **http://localhost:5000**

## Project Structure

```
Real-Time-Collaborative-Note-Taking-App/
└── backend/
    ├── src/
    │   ├── config/      # Database, Redis, Auth config
    │   ├── controllers/ # Request handlers
    │   ├── middleware/   # Auth, Security, Validation
    │   ├── models/      # Database models (Sequelize)
    │   ├── routes/      # API routes
    │   ├── services/    # Business logic
    │   ├── socket/      # WebSocket handlers
    │   ├── types/       # TypeScript types
    │   └── utils/       # Logger, Errors, Response
    ├── Dockerfile
    ├── docker-compose.yml
    └── package.json
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1` | API documentation |
| GET | `/api/v1/health` | Health check |
| POST | `/api/v1/auth/register` | Register |
| POST | `/api/v1/auth/login` | Login |
| POST | `/api/v1/notes` | Create note |
| GET | `/api/v1/notes` | Get all notes |
| PUT | `/api/v1/notes/:id` | Update note |
| DELETE | `/api/v1/notes/:id` | Delete note |
| POST | `/api/v1/notes/:id/share` | Share note |

## Tech Stack

- **Backend**: Node.js, Express.js, TypeScript
- **Database**: PostgreSQL (prod) / SQLite (dev)
- **Cache**: Redis (prod) / In-Memory (dev)
- **Real-time**: Socket.io
- **Auth**: JWT + Passport.js (Google, GitHub OAuth)
- **ORM**: Sequelize
- **Deployment**: Docker + Docker Compose

## Documentation

See [backend/README.md](backend/README.md) for complete API documentation, WebSocket events, database schema, and more.

## License

ISC
