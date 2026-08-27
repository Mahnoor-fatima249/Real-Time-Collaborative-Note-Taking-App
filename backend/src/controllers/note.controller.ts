import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import { NoteService } from '../services/note.service';
import { asyncHandler } from '../middleware/errorHandler';

export class NoteController {
  static create = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    const note = await NoteService.create(req.userId!, req.body);

    res.status(201).json({
      success: true,
      data: { note },
    });
  });

  static getAll = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    const { page, limit, sortBy, sortOrder, search, tags } = req.query;

    const result = await NoteService.getAll(req.userId!, {
      page: page ? parseInt(page as string) : 1,
      limit: limit ? parseInt(limit as string) : 20,
      sortBy: sortBy as string,
      sortOrder: sortOrder as 'ASC' | 'DESC',
      search: search as string,
      tags: tags ? String(tags).split(',') : undefined,
    });

    res.json({
      success: true,
      data: {
        notes: result.notes,
        pagination: {
          total: result.total,
          page: result.page,
          totalPages: result.totalPages,
          limit: limit ? parseInt(limit as string) : 20,
        },
      },
    });
  });

  static getById = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    const noteId = String(req.params.id);
    const note = await NoteService.getById(noteId, req.userId);

    res.json({
      success: true,
      data: { note },
    });
  });

  static update = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    const noteId = String(req.params.id);
    const note = await NoteService.update(noteId, req.userId!, req.body);

    res.json({
      success: true,
      data: { note },
    });
  });

  static delete = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    const noteId = String(req.params.id);
    await NoteService.delete(noteId, req.userId!);

    res.json({
      success: true,
      data: { message: 'Note deleted successfully' },
    });
  });

  static restore = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    const noteId = String(req.params.id);
    const note = await NoteService.restore(noteId, req.userId!);

    res.json({
      success: true,
      data: { note },
    });
  });

  static getVersions = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    const noteId = String(req.params.id);
    const versions = await NoteService.getVersions(noteId, req.userId!);

    res.json({
      success: true,
      data: { versions },
    });
  });

  static restoreVersion = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    const noteId = String(req.params.id);
    const version = Number(req.params.version);
    const note = await NoteService.restoreVersion(noteId, version, req.userId!);

    res.json({
      success: true,
      data: { note },
    });
  });

  static share = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    const noteId = String(req.params.id);
    const { email, permission } = req.body;
    const share = await NoteService.share(noteId, req.userId!, email, permission);

    res.status(201).json({
      success: true,
      data: { share },
    });
  });

  static removeShare = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    const noteId = String(req.params.id);
    const userId = String(req.params.userId);
    await NoteService.removeShare(noteId, req.userId!, userId);

    res.json({
      success: true,
      data: { message: 'Share removed successfully' },
    });
  });

  static getSharedNotes = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    const notes = await NoteService.getSharedNotes(req.userId!);

    res.json({
      success: true,
      data: { notes },
    });
  });

  static getDeletedNotes = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    const notes = await NoteService.getDeletedNotes(req.userId!);

    res.json({
      success: true,
      data: { notes },
    });
  });

  static permanentlyDelete = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    const noteId = String(req.params.id);
    await NoteService.permanentlyDelete(noteId, req.userId!);

    res.json({
      success: true,
      data: { message: 'Note permanently deleted' },
    });
  });
}
