export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    code?: string;
    details?: any;
  };
  pagination?: {
    total: number;
    page: number;
    totalPages: number;
    limit: number;
  };
}

export interface PaginationQuery {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
  search?: string;
  tags?: string[];
}

export interface SocketEvents {
  // Client -> Server
  'join-note': (noteId: string) => void;
  'leave-note': (noteId: string) => void;
  'content-change': (data: {
    noteId: string;
    delta: any;
    version: number;
    cursor?: CursorPosition;
  }) => void;
  'cursor-update': (data: {
    noteId: string;
    cursor: CursorPosition;
  }) => void;
  'title-change': (data: {
    noteId: string;
    title: string;
  }) => void;
  'selection-change': (data: {
    noteId: string;
    selection: Selection;
  }) => void;
  'typing-start': (noteId: string) => void;
  'typing-stop': (noteId: string) => void;
  'lock-section': (data: {
    noteId: string;
    section: string;
  }) => void;
  'unlock-section': (data: {
    noteId: string;
    section: string;
  }) => void;

  // Server -> Client
  'note-joined': (data: {
    note: Note;
    users: CollaborationUser[];
    yourUser: CollaborationUser;
  }) => void;
  'user-joined': (data: {
    user: CollaborationUser;
    users: CollaborationUser[];
  }) => void;
  'user-left': (data: {
    userId: string;
    users: CollaborationUser[];
  }) => void;
  'remote-change': (data: {
    userId: string;
    delta: any;
    version: number;
    cursor?: CursorPosition;
  }) => void;
  'remote-cursor': (data: {
    userId: string;
    cursor: CursorPosition;
  }) => void;
  'remote-title-change': (data: {
    userId: string;
    title: string;
  }) => void;
  'remote-selection': (data: {
    userId: string;
    selection: Selection;
  }) => void;
  'user-typing': (data: {
    userId: string;
    isTyping: boolean;
  }) => void;
  'section-locked': (data: {
    userId: string;
    section: string;
  }) => void;
  'section-unlocked': (data: {
    userId: string;
    section: string;
  }) => void;
  'error': (data: { message: string }) => void;
}

export interface CursorPosition {
  position: number;
  selection?: Selection;
}

export interface Selection {
  start: number;
  end: number;
}

export interface CollaborationUser {
  id: string;
  username: string;
  displayName: string;
  avatar?: string;
  color: string;
  cursor?: CursorPosition;
}

export interface Note {
  id: string;
  title: string;
  content: any;
  plainText: string;
  ownerId: string;
  isPublic: boolean;
  isPinned: boolean;
  isArchived: boolean;
  isDeleted: boolean;
  version: number;
  wordCount: number;
  characterCount: number;
  tags: string[];
  color?: string;
  coverImage?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface User {
  id: string;
  email: string;
  username: string;
  displayName: string;
  avatar?: string;
  provider: 'local' | 'google' | 'github';
  isEmailVerified: boolean;
  role: 'user' | 'admin' | 'moderator';
  status: 'active' | 'inactive' | 'suspended';
  createdAt: Date;
  updatedAt: Date;
}

export interface JWTPayload {
  userId: string;
  iat: number;
  exp: number;
}

export interface RefreshTokenPayload {
  userId: string;
  tokenVersion: string;
  iat: number;
  exp: number;
}
