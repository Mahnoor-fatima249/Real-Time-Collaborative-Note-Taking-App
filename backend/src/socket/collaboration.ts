import { Server as SocketIOServer, Socket } from 'socket.io';
import { Server as HttpServer } from 'http';
import { socketAuth } from '../middleware/auth';
import { NoteService } from '../services/note.service';
import { cache } from '../config/redis';
import { logger } from '../utils/logger';

interface CollaborationUser {
  id: string;
  username: string;
  displayName: string;
  avatar?: string;
  color: string;
  cursor?: {
    position: number;
    selection?: { start: number; end: number };
  };
}

interface NoteRoom {
  noteId: string;
  users: Map<string, CollaborationUser>;
  lastActivity: Date;
}

interface ExtendedSocket extends Socket {
  userId?: string;
  user?: any;
}

const USER_COLORS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
  '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9',
  '#F8C471', '#82E0AA', '#F1948A', '#AED6F1', '#A3E4D7',
];

export class CollaborationManager {
  private io: SocketIOServer;
  private rooms: Map<string, NoteRoom> = new Map();
  private userSockets: Map<string, Set<string>> = new Map();
  private notesToUsers: Map<string, Set<string>> = new Map();

  constructor(server: HttpServer) {
    this.io = new SocketIOServer(server, {
      cors: {
        origin: process.env.FRONTEND_URL || 'http://localhost:3000',
        methods: ['GET', 'POST'],
        credentials: true,
      },
      pingTimeout: 60000,
      pingInterval: 25000,
      transports: ['websocket', 'polling'],
    });

    this.setupMiddleware();
    this.setupEventHandlers();
    this.setupRedisSubscription();

    logger.info('Collaboration manager initialized');
  }

  private setupMiddleware(): void {
    this.io.use(socketAuth as any);
  }

  private setupEventHandlers(): void {
    this.io.on('connection', (socket: ExtendedSocket) => {
      const userId = socket.userId as string;
      logger.info(`User connected: ${userId} (${socket.id})`);

      // Track user socket
      if (!this.userSockets.has(userId)) {
        this.userSockets.set(userId, new Set());
      }
      this.userSockets.get(userId)!.add(socket.id);

      // Handle joining a note room
      socket.on('join-note', async (noteId: string) => {
        try {
          // Check access
          const note = await NoteService.getById(noteId, userId);
          if (!note) {
            socket.emit('error', { message: 'Note not found' });
            return;
          }

          // Join the room
          socket.join(`note:${noteId}`);

          // Initialize room if needed
          if (!this.rooms.has(noteId)) {
            this.rooms.set(noteId, {
              noteId,
              users: new Map(),
              lastActivity: new Date(),
            });
            this.notesToUsers.set(noteId, new Set());
          }

          const room = this.rooms.get(noteId)!;
          const user = socket.user as any;

          const collaborationUser: CollaborationUser = {
            id: userId,
            username: user.username,
            displayName: user.displayName,
            avatar: user.avatar,
            color: USER_COLORS[room.users.size % USER_COLORS.length],
          };

          room.users.set(userId, collaborationUser);
          this.notesToUsers.get(noteId)!.add(userId);

          // Notify others
          socket.to(`note:${noteId}`).emit('user-joined', {
            user: collaborationUser,
            users: Array.from(room.users.values()),
          });

          // Send current state to user
          socket.emit('note-joined', {
            note: note.toJSON(),
            users: Array.from(room.users.values()),
            yourUser: collaborationUser,
          });

          logger.info(`User ${userId} joined note ${noteId}`);
        } catch (error) {
          socket.emit('error', { message: 'Failed to join note' });
          logger.error(`Error joining note: ${error}`);
        }
      });

      // Handle content changes (Operational Transform style)
      socket.on('content-change', async (data: {
        noteId: string;
        delta: any;
        version: number;
        cursor?: any;
      }) => {
        try {
          const { noteId, delta, version, cursor } = data;

          // Broadcast to others in the room
          socket.to(`note:${noteId}`).emit('remote-change', {
            userId,
            delta,
            version,
            cursor,
          });

          // Update user cursor in room
          const room = this.rooms.get(noteId);
          if (room) {
            const user = room.users.get(userId);
            if (user && cursor) {
              user.cursor = cursor;
            }
            room.lastActivity = new Date();
          }

          // Debounced save to database
          await this.debouncedSave(noteId, userId, delta, version);
        } catch (error) {
          logger.error(`Error handling content change: ${error}`);
        }
      });

      // Handle cursor updates
      socket.on('cursor-update', (data: {
        noteId: string;
        cursor: { position: number; selection?: { start: number; end: number } };
      }) => {
        const { noteId, cursor } = data;

        socket.to(`note:${noteId}`).emit('remote-cursor', {
          userId,
          cursor,
        });

        // Update room state
        const room = this.rooms.get(noteId);
        if (room) {
          const user = room.users.get(userId);
          if (user) {
            user.cursor = cursor;
          }
        }
      });

      // Handle title changes
      socket.on('title-change', async (data: {
        noteId: string;
        title: string;
      }) => {
        const { noteId, title } = data;

        socket.to(`note:${noteId}`).emit('remote-title-change', {
          userId,
          title,
        });
      });

      // Handle selection changes
      socket.on('selection-change', (data: {
        noteId: string;
        selection: { start: number; end: number };
      }) => {
        const { noteId, selection } = data;

        socket.to(`note:${noteId}`).emit('remote-selection', {
          userId,
          selection,
        });
      });

      // Handle leaving a note
      socket.on('leave-note', (noteId: string) => {
        this.handleLeaveNote(socket, noteId);
      });

      // Handle disconnection
      socket.on('disconnect', async () => {
        logger.info(`User disconnected: ${userId} (${socket.id})`);

        // Remove socket from tracking
        const sockets = this.userSockets.get(userId);
        if (sockets) {
          sockets.delete(socket.id);
          if (sockets.size === 0) {
            this.userSockets.delete(userId);
          }
        }

        // Remove from all rooms
        for (const [noteId, room] of this.rooms.entries()) {
          if (room.users.has(userId)) {
            this.handleLeaveNote(socket, noteId);
          }
        }
      });

      // Handle typing indicators
      socket.on('typing-start', (noteId: string) => {
        socket.to(`note:${noteId}`).emit('user-typing', { userId, isTyping: true });
      });

      socket.on('typing-stop', (noteId: string) => {
        socket.to(`note:${noteId}`).emit('user-typing', { userId, isTyping: false });
      });

      // Handle locking/unlocking sections
      socket.on('lock-section', (data: {
        noteId: string;
        section: string;
      }) => {
        socket.to(`note:${data.noteId}`).emit('section-locked', {
          userId,
          section: data.section,
        });
      });

      socket.on('unlock-section', (data: {
        noteId: string;
        section: string;
      }) => {
        socket.to(`note:${data.noteId}`).emit('section-unlocked', {
          userId,
          section: data.section,
        });
      });
    });
  }

  private handleLeaveNote(socket: ExtendedSocket, noteId: string): void {
    const userId = socket.userId as string;
    const room = this.rooms.get(noteId);

    if (room) {
      room.users.delete(userId);
      socket.leave(`note:${noteId}`);

      const notesUsers = this.notesToUsers.get(noteId);
      if (notesUsers) {
        notesUsers.delete(userId);
        if (notesUsers.size === 0) {
          this.notesToUsers.delete(noteId);
          this.rooms.delete(noteId);
        }
      }

      // Notify others
      socket.to(`note:${noteId}`).emit('user-left', {
        userId,
        users: Array.from(room.users.values()),
      });

      logger.info(`User ${userId} left note ${noteId}`);
    }
  }

  private saveTimeouts: Map<string, NodeJS.Timeout> = new Map();

  private async debouncedSave(
    noteId: string,
    userId: string,
    delta: any,
    version: number
  ): Promise<void> {
    const key = `${noteId}`;

    if (this.saveTimeouts.has(key)) {
      clearTimeout(this.saveTimeouts.get(key)!);
    }

    const timeout = setTimeout(async () => {
      try {
        // Save the latest content
        // This is a simplified version - in production, you'd use operational transforms
        await NoteService.update(noteId, userId, {
          content: delta,
        });
        logger.debug(`Auto-saved note ${noteId}`);
      } catch (error) {
        logger.error(`Error auto-saving note ${noteId}: ${error}`);
      } finally {
        this.saveTimeouts.delete(key);
      }
    }, 1000); // Save after 1 second of inactivity

    this.saveTimeouts.set(key, timeout);
  }

  private setupRedisSubscription(): void {
    cache.subscribe('note:updates', (message: string) => {
      try {
        const data = JSON.parse(message);
        const { noteId, userId, type, payload } = data;

        // Broadcast to all users in the note room
        this.io.to(`note:${noteId}`).emit(type, {
          ...payload,
          userId,
        });
      } catch (error) {
        logger.error(`Error processing Redis message: ${error}`);
      }
    });
  }

  // Public methods
  public broadcastToNote(noteId: string, event: string, data: any): void {
    this.io.to(`note:${noteId}`).emit(event, data);
  }

  public getOnlineUsers(noteId: string): CollaborationUser[] {
    const room = this.rooms.get(noteId);
    return room ? Array.from(room.users.values()) : [];
  }

  public isUserOnline(userId: string): boolean {
    return this.userSockets.has(userId);
  }

  public notifyUser(userId: string, event: string, data: any): void {
    const sockets = this.userSockets.get(userId);
    if (sockets) {
      for (const socketId of sockets) {
        this.io.to(socketId).emit(event, data);
      }
    }
  }

  public getStats() {
    return {
      totalRooms: this.rooms.size,
      totalUsers: this.userSockets.size,
      rooms: Array.from(this.rooms.entries()).map(([noteId, room]) => ({
        noteId,
        userCount: room.users.size,
        lastActivity: room.lastActivity,
      })),
    };
  }
}
