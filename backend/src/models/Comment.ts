import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';

interface CommentAttributes {
  id: string;
  noteId: string;
  userId: string;
  content: string;
  parentId?: string;
  isResolved: boolean;
  position?: any;
  createdAt?: Date;
  updatedAt?: Date;
}

interface CommentCreationAttributes extends Optional<CommentAttributes, 'id' | 'parentId' | 'isResolved' | 'position' | 'createdAt' | 'updatedAt'> {}

class Comment extends Model<CommentAttributes, CommentCreationAttributes> implements CommentAttributes {
  public id!: string;
  public noteId!: string;
  public userId!: string;
  public content!: string;
  public parentId?: string;
  public isResolved!: boolean;
  public position?: any;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Comment.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    noteId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'notes', key: 'id' },
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'users', key: 'id' },
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    parentId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: { model: 'comments', key: 'id' },
    },
    isResolved: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    position: {
      type: DataTypes.JSONB,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'comments',
    indexes: [
      { fields: ['note_id'] },
      { fields: ['user_id'] },
      { fields: ['parent_id'] },
    ],
  }
);

export default Comment;
