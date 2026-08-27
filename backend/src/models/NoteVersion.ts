import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';

interface NoteVersionAttributes {
  id: string;
  noteId: string;
  version: number;
  title: string;
  content: any;
  plainText: string;
  editedBy: string;
  changeDescription?: string;
  createdAt?: Date;
}

interface NoteVersionCreationAttributes extends Optional<NoteVersionAttributes, 'id' | 'changeDescription' | 'createdAt'> {}

class NoteVersion extends Model<NoteVersionAttributes, NoteVersionCreationAttributes> implements NoteVersionAttributes {
  public id!: string;
  public noteId!: string;
  public version!: number;
  public title!: string;
  public content!: any;
  public plainText!: string;
  public editedBy!: string;
  public changeDescription?: string;
  public readonly createdAt!: Date;
}

NoteVersion.init(
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
    version: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    title: {
      type: DataTypes.STRING(500),
      allowNull: false,
    },
    content: {
      type: DataTypes.JSONB,
      allowNull: true,
    },
    plainText: {
      type: DataTypes.TEXT,
      defaultValue: '',
    },
    editedBy: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'users', key: 'id' },
    },
    changeDescription: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'note_versions',
    indexes: [
      { fields: ['note_id'] },
      { unique: true, fields: ['note_id', 'version'] },
    ],
  }
);

export default NoteVersion;
