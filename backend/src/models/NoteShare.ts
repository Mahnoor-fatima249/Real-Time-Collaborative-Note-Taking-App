import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';

const isSQLite = sequelize.getDialect() === 'sqlite';

interface NoteShareAttributes {
  id: string;
  noteId: string;
  userId: string;
  permission: 'read' | 'write' | 'admin';
  sharedBy: string;
  isActive: boolean;
  expiresAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

interface NoteShareCreationAttributes extends Optional<NoteShareAttributes, 'id' | 'isActive' | 'createdAt' | 'updatedAt'> {}

class NoteShare extends Model<NoteShareAttributes, NoteShareCreationAttributes> implements NoteShareAttributes {
  public id!: string;
  public noteId!: string;
  public userId!: string;
  public permission!: 'read' | 'write' | 'admin';
  public sharedBy!: string;
  public isActive!: boolean;
  public expiresAt?: Date;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

NoteShare.init(
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
    permission: {
      type: isSQLite ? DataTypes.STRING : DataTypes.ENUM('read', 'write', 'admin'),
      defaultValue: 'read',
    },
    sharedBy: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'users', key: 'id' },
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    expiresAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'note_shares',
    indexes: [
      { unique: true, fields: ['note_id', 'user_id'] },
      { fields: ['user_id'] },
    ],
  }
);

export default NoteShare;
