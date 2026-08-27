import { Router, Request, Response, NextFunction } from 'express';
import { body, param, query } from 'express-validator';
import { NoteController } from '../controllers/note.controller';
import { authenticate, optionalAuth } from '../middleware/auth';
import { validate } from '../middleware/validation';

const router = Router();

// Wrap async handlers for route compatibility
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const wrap = (fn: any) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// Validation rules
const createNoteValidation = [
  body('title').optional().isLength({ max: 500 }).withMessage('Title must be less than 500 characters'),
  body('content').optional().isObject().withMessage('Content must be an object'),
  body('plainText').optional().isString().withMessage('Plain text must be a string'),
  body('isPublic').optional().isBoolean().withMessage('isPublic must be a boolean'),
  body('tags').optional().isArray().withMessage('Tags must be an array'),
  body('color').optional().matches(/^#[0-9A-Fa-f]{6}$/).withMessage('Color must be a valid hex color'),
];

const updateNoteValidation = [
  body('title').optional().isLength({ max: 500 }).withMessage('Title must be less than 500 characters'),
  body('content').optional().isObject().withMessage('Content must be an object'),
  body('plainText').optional().isString().withMessage('Plain text must be a string'),
  body('isPublic').optional().isBoolean().withMessage('isPublic must be a boolean'),
  body('isPinned').optional().isBoolean().withMessage('isPinned must be a boolean'),
  body('isArchived').optional().isBoolean().withMessage('isArchived must be a boolean'),
  body('tags').optional().isArray().withMessage('Tags must be an array'),
  body('color').optional().matches(/^#[0-9A-Fa-f]{6}$/).withMessage('Color must be a valid hex color'),
];

const shareValidation = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('permission').isIn(['read', 'write', 'admin']).withMessage('Permission must be read, write, or admin'),
];

const paginationValidation = [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('sortBy').optional().isIn(['created_at', 'updated_at', 'title']).withMessage('Invalid sort field'),
  query('sortOrder').optional().isIn(['ASC', 'DESC']).withMessage('Sort order must be ASC or DESC'),
];

// Public routes (for shared/public notes)
router.get('/public', optionalAuth, wrap(NoteController.getAll));

// Protected routes
router.use(authenticate);

router.post('/', validate(createNoteValidation), wrap(NoteController.create));
router.get('/', validate(paginationValidation), wrap(NoteController.getAll));
router.get('/shared', wrap(NoteController.getSharedNotes));
router.get('/deleted', wrap(NoteController.getDeletedNotes));
router.get('/:id', wrap(NoteController.getById));
router.put('/:id', validate(updateNoteValidation), wrap(NoteController.update));
router.delete('/:id', wrap(NoteController.delete));
router.post('/:id/restore', wrap(NoteController.restore));
router.get('/:id/versions', wrap(NoteController.getVersions));
router.post('/:id/versions/:version/restore', wrap(NoteController.restoreVersion));
router.post('/:id/share', validate(shareValidation), wrap(NoteController.share));
router.delete('/:id/share/:userId', wrap(NoteController.removeShare));
router.delete('/:id/permanent', wrap(NoteController.permanentlyDelete));

export default router;
