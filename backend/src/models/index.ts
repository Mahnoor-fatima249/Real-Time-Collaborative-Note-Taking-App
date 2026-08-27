import User from './User';
import Note from './Note';
import NoteShare from './NoteShare';
import NoteVersion from './NoteVersion';
import Comment from './Comment';
import RefreshToken from './RefreshToken';

// User associations
User.hasMany(Note, { foreignKey: 'ownerId', as: 'ownedNotes' });
User.hasMany(NoteShare, { foreignKey: 'userId', as: 'sharedWithMe' });
User.hasMany(NoteShare, { foreignKey: 'sharedBy', as: 'sharedByMe' });
User.hasMany(Comment, { foreignKey: 'userId', as: 'comments' });
User.hasMany(RefreshToken, { foreignKey: 'userId', as: 'refreshTokens' });

// Note associations
Note.belongsTo(User, { foreignKey: 'ownerId', as: 'owner' });
Note.hasMany(NoteShare, { foreignKey: 'noteId', as: 'shares' });
Note.hasMany(NoteVersion, { foreignKey: 'noteId', as: 'versions' });
Note.hasMany(Comment, { foreignKey: 'noteId', as: 'comments' });

// NoteShare associations
NoteShare.belongsTo(User, { foreignKey: 'userId', as: 'user' });
NoteShare.belongsTo(User, { foreignKey: 'sharedBy', as: 'sharer' });
NoteShare.belongsTo(Note, { foreignKey: 'noteId', as: 'note' });

// NoteVersion associations
NoteVersion.belongsTo(User, { foreignKey: 'editedBy', as: 'editor' });
NoteVersion.belongsTo(Note, { foreignKey: 'noteId', as: 'note' });

// Comment associations
Comment.belongsTo(User, { foreignKey: 'userId', as: 'author' });
Comment.belongsTo(Note, { foreignKey: 'noteId', as: 'note' });
Comment.hasMany(Comment, { foreignKey: 'parentId', as: 'replies' });

// RefreshToken associations
RefreshToken.belongsTo(User, { foreignKey: 'userId', as: 'user' });

export {
  User,
  Note,
  NoteShare,
  NoteVersion,
  Comment,
  RefreshToken,
};
