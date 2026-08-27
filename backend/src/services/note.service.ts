import { Op } from 'sequelize';
import { sequelize } from '../config/database';
import { Note, NoteShare, NoteVersion, User } from '../models';
import { cache } from '../config/redis';
import { NotFoundError, ForbiddenError, BadRequestError } from '../utils/AppError';
import { logger } from '../utils/logger';

interface CreateNoteDTO {
  title?: string;
  content?: any;
  plainText?: string;
  isPublic?: boolean;
  tags?: string[];
  color?: string;
}

interface UpdateNoteDTO {
  title?: string;
  content?: any;
  plainText?: string;
  isPublic?: boolean;
  isPinned?: boolean;
  isArchived?: boolean;
  tags?: string[];
  color?: string;
  coverImage?: string;
}

interface PaginationOptions {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
  search?: string;
  tags?: string[];
}

export class NoteService {
  private static CACHE_PREFIX = 'note:';
  private static CACHE_TTL = 300; // 5 minutes

  static async create(userId: string, data: CreateNoteDTO): Promise<Note> {
    const note = await Note.create({
      title: data.title || 'Untitled',
      content: data.content || null,
      plainText: data.plainText || '',
      ownerId: userId,
      lastEditedBy: userId,
      tags: data.tags || [],
      isPublic: data.isPublic || false,
      color: data.color,
    });

    note.calculateStats();
    await note.save();

    // Create initial version
    await NoteVersion.create({
      noteId: note.id,
      version: 1,
      title: note.title,
      content: note.content,
      plainText: note.plainText,
      editedBy: userId,
      changeDescription: 'Initial version',
    });

    // Cache the note
    await this.cacheNote(note);

    logger.info(`Note created: ${note.id} by user ${userId}`);

    return note;
  }

  static async getById(noteId: string, userId?: string): Promise<Note> {
    const cacheKey = `${this.CACHE_PREFIX}${noteId}`;
    const cached = await cache.get(cacheKey);

    if (cached) {
      const noteData = JSON.parse(cached);
      if (userId && noteData.ownerId !== userId) {
        const hasAccess = await this.checkAccess(noteId, userId);
        if (!hasAccess && !noteData.isPublic) {
          throw new ForbiddenError('Access denied');
        }
      }
      return Note.findByPk(noteId) as Promise<Note>;
    }

    const note = await Note.findByPk(noteId, {
      include: [
        { model: User, as: 'owner', attributes: ['id', 'username', 'displayName', 'avatar'] },
        {
          model: NoteShare,
          as: 'shares',
          include: [{ model: User, as: 'user', attributes: ['id', 'username', 'displayName', 'avatar'] }],
        },
      ],
    });

    if (!note || note.isDeleted) {
      throw new NotFoundError('Note');
    }

    if (userId && note.ownerId !== userId) {
      const hasAccess = await this.checkAccess(noteId, userId);
      if (!hasAccess && !note.isPublic) {
        throw new ForbiddenError('Access denied');
      }
    }

    await this.cacheNote(note);
    return note;
  }

  static async getAll(userId: string, options: PaginationOptions = {}): Promise<{ notes: Note[]; total: number; page: number; totalPages: number }> {
    const {
      page = 1,
      limit = 20,
      sortBy = 'updated_at',
      sortOrder = 'DESC',
      search,
      tags,
    } = options;

    const offset = (page - 1) * limit;
    const where: any = {
      [Op.or]: [
        { ownerId: userId },
        { isPublic: true },
      ],
      isDeleted: false,
    };

    if (search) {
      where[Op.and] = [
        {
          [Op.or]: [
            { title: { [Op.iLike]: `%${search}%` } },
            { plainText: { [Op.iLike]: `%${search}%` } },
          ],
        },
      ];
    }

    if (tags && tags.length > 0) {
      const dialect = sequelize.getDialect();
      if (dialect === 'sqlite') {
        // SQLite: use LIKE for tag filtering
        where[Op.and] = tags.map((tag) => ({
          tags: { [Op.like]: `%"${tag}"%` },
        }));
      } else {
        where.tags = { [Op.overlap]: tags };
      }
    }

    const { rows: notes, count: total } = await Note.findAndCountAll({
      where,
      include: [
        { model: User, as: 'owner', attributes: ['id', 'username', 'displayName', 'avatar'] },
      ],
      order: [
        ['is_pinned', 'DESC'],
        [sortBy, sortOrder],
      ],
      limit,
      offset,
    });

    const totalPages = Math.ceil(total / limit);

    return { notes, total, page, totalPages };
  }

  static async update(noteId: string, userId: string, data: UpdateNoteDTO): Promise<Note> {
    const note = await Note.findByPk(noteId);
    if (!note || note.isDeleted) {
      throw new NotFoundError('Note');
    }

    const hasAccess = await this.checkWriteAccess(noteId, userId);
    if (!hasAccess) {
      throw new ForbiddenError('Access denied');
    }

    // Save version before update (only if content/title changed)
    if (data.content || data.title) {
      const existingVersion = await NoteVersion.findOne({
        where: { noteId: note.id, version: note.version },
      });

      if (!existingVersion) {
        await NoteVersion.create({
          noteId: note.id,
          version: note.version,
          title: note.title,
          content: note.content,
          plainText: note.plainText,
          editedBy: userId,
          changeDescription: `Version ${note.version}`,
        });
      }

      note.version += 1;
    }

    // Update note
    if (data.title !== undefined) note.title = data.title;
    if (data.content !== undefined) note.content = data.content;
    if (data.plainText !== undefined) note.plainText = data.plainText;
    if (data.isPublic !== undefined) note.isPublic = data.isPublic;
    if (data.isPinned !== undefined) note.isPinned = data.isPinned;
    if (data.isArchived !== undefined) note.isArchived = data.isArchived;
    if (data.tags !== undefined) note.tags = data.tags;
    if (data.color !== undefined) note.color = data.color;
    if (data.coverImage !== undefined) note.coverImage = data.coverImage;
    note.lastEditedBy = userId;

    note.calculateStats();
    await note.save();

    // Invalidate cache
    await this.invalidateCache(noteId);

    logger.info(`Note updated: ${noteId} by user ${userId}`);

    return note;
  }

  static async delete(noteId: string, userId: string): Promise<void> {
    const note = await Note.findByPk(noteId);
    if (!note) {
      throw new NotFoundError('Note');
    }

    if (note.ownerId !== userId) {
      const hasAccess = await this.checkAccess(noteId, userId, 'admin');
      if (!hasAccess) {
        throw new ForbiddenError('Only the owner can delete this note');
      }
    }

    // Soft delete
    await note.update({
      isDeleted: true,
      deletedAt: new Date(),
    });

    // Invalidate cache
    await this.invalidateCache(noteId);

    logger.info(`Note deleted: ${noteId} by user ${userId}`);
  }

  static async restore(noteId: string, userId: string): Promise<Note> {
    const note = await Note.findByPk(noteId, { paranoid: false });
    if (!note || !note.isDeleted) {
      throw new NotFoundError('Note');
    }

    if (note.ownerId !== userId) {
      throw new ForbiddenError('Only the owner can restore this note');
    }

    // Use restore() method from paranoid model to undo soft delete
    await (note as any).restore();
    await note.update({
      isDeleted: false,
    });

    await this.invalidateCache(noteId);

    logger.info(`Note restored: ${noteId} by user ${userId}`);

    return note;
  }

  static async getVersions(noteId: string, userId: string): Promise<NoteVersion[]> {
    const note = await Note.findByPk(noteId);
    if (!note || note.isDeleted) {
      throw new NotFoundError('Note');
    }

    const hasAccess = await this.checkAccess(noteId, userId);
    if (!hasAccess && !note.isPublic) {
      throw new ForbiddenError('Access denied');
    }

    return NoteVersion.findAll({
      where: { noteId },
      include: [{ model: User, as: 'editor', attributes: ['id', 'username', 'displayName', 'avatar'] }],
      order: [['version', 'DESC']],
    });
  }

  static async restoreVersion(noteId: string, version: number, userId: string): Promise<Note> {
    const noteVersion = await NoteVersion.findOne({
      where: { noteId, version },
    });

    if (!noteVersion) {
      throw new NotFoundError('Version');
    }

    const note = await Note.findByPk(noteId);
    if (!note || note.isDeleted) {
      throw new NotFoundError('Note');
    }

    const hasAccess = await this.checkWriteAccess(noteId, userId);
    if (!hasAccess) {
      throw new ForbiddenError('Access denied');
    }

    // Save current version
    await NoteVersion.create({
      noteId: note.id,
      version: note.version,
      title: note.title,
      content: note.content,
      plainText: note.plainText,
      editedBy: userId,
      changeDescription: `Before restore to version ${version}`,
    });

    // Restore
    note.version += 1;
    note.title = noteVersion.title;
    note.content = noteVersion.content;
    note.plainText = noteVersion.plainText;
    note.lastEditedBy = userId;
    note.calculateStats();

    await note.save();
    await this.invalidateCache(noteId);

    logger.info(`Note version restored: ${noteId} to version ${version} by user ${userId}`);

    return note;
  }

  static async share(noteId: string, ownerUserId: string, targetUserEmail: string, permission: 'read' | 'write' | 'admin'): Promise<NoteShare> {
    const note = await Note.findByPk(noteId);
    if (!note || note.isDeleted) {
      throw new NotFoundError('Note');
    }

    if (note.ownerId !== ownerUserId) {
      throw new ForbiddenError('Only the owner can share this note');
    }

    const targetUser = await User.findOne({ where: { email: targetUserEmail } });
    if (!targetUser) {
      throw new NotFoundError('User');
    }

    if (targetUser.id === ownerUserId) {
      throw new BadRequestError('Cannot share with yourself');
    }

    const existingShare = await NoteShare.findOne({
      where: { noteId, userId: targetUser.id },
    });

    if (existingShare) {
      await existingShare.update({ permission, isActive: true });
      return existingShare;
    }

    const share = await NoteShare.create({
      noteId,
      userId: targetUser.id,
      permission,
      sharedBy: ownerUserId,
    });

    logger.info(`Note shared: ${noteId} with ${targetUserEmail} as ${permission}`);

    return share;
  }

  static async removeShare(noteId: string, userId: string, targetUserId: string): Promise<void> {
    const note = await Note.findByPk(noteId);
    if (!note) {
      throw new NotFoundError('Note');
    }

    if (note.ownerId !== userId) {
      throw new ForbiddenError('Only the owner can remove shares');
    }

    await NoteShare.update(
      { isActive: false },
      { where: { noteId, userId: targetUserId } }
    );

    await this.invalidateCache(noteId);
  }

  static async getSharedNotes(userId: string): Promise<Note[]> {
    const sharedNotes = await NoteShare.findAll({
      where: { userId, isActive: true },
      include: [
        {
          model: Note,
          as: 'note',
          where: { isDeleted: false },
          include: [{ model: User, as: 'owner', attributes: ['id', 'username', 'displayName', 'avatar'] }],
        },
      ],
    });

    return sharedNotes.map((share) => (share as any).note);
  }

  static async getDeletedNotes(userId: string): Promise<Note[]> {
    return Note.findAll({
      where: { ownerId: userId, isDeleted: true },
      paranoid: false,
      order: [['deletedAt', 'DESC']],
    });
  }

  static async permanentlyDelete(noteId: string, userId: string): Promise<void> {
    const note = await Note.findByPk(noteId, { paranoid: false });
    if (!note || note.ownerId !== userId) {
      throw new NotFoundError('Note');
    }

    await NoteVersion.destroy({ where: { noteId } });
    await NoteShare.destroy({ where: { noteId } });
    await Note.destroy({ where: { id: noteId }, force: true });

    await this.invalidateCache(noteId);

    logger.info(`Note permanently deleted: ${noteId}`);
  }

  private static async checkAccess(noteId: string, userId: string, requiredPermission: string = 'read'): Promise<boolean> {
    const note = await Note.findByPk(noteId);
    if (!note) return false;

    if (note.ownerId === userId) return true;

    const share = await NoteShare.findOne({
      where: { noteId, userId, isActive: true },
    });

    if (!share) return false;

    const permissionLevels: Record<string, number> = { read: 1, write: 2, admin: 3 };
    return (permissionLevels[share.permission] || 0) >= (permissionLevels[requiredPermission] || 0);
  }

  private static async checkWriteAccess(noteId: string, userId: string): Promise<boolean> {
    return this.checkAccess(noteId, userId, 'write');
  }

  private static async cacheNote(note: Note): Promise<void> {
    const cacheKey = `${this.CACHE_PREFIX}${note.id}`;
    await cache.set(cacheKey, JSON.stringify(note.toJSON()), this.CACHE_TTL);
  }

  private static async invalidateCache(noteId: string): Promise<void> {
    await cache.del(`${this.CACHE_PREFIX}${noteId}`);
  }
}
