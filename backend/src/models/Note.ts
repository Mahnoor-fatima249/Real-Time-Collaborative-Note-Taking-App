import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';

const isSQLite = sequelize.getDialect() === 'sqlite';

interface NoteAttributes {
  id: string;
  title: string;
  content: any;
  plainText: string;
  ownerId: string;
  isPublic: boolean;
  isPinned: boolean;
  isArchived: boolean;
  isDeleted: boolean;
  deletedAt?: Date;
  lastEditedBy?: string;
  version: number;
  wordCount: number;
  characterCount: number;
  tags: string[];
  color?: string;
  coverImage?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

interface NoteCreationAttributes extends Optional<NoteAttributes, 'id' | 'isPublic' | 'isPinned' | 'isArchived' | 'isDeleted' | 'version' | 'wordCount' | 'characterCount' | 'tags' | 'createdAt' | 'updatedAt'> {}

class Note extends Model<NoteAttributes, NoteCreationAttributes> implements NoteAttributes {
  public id!: string;
  public title!: string;
  public content!: any;
  public plainText!: string;
  public ownerId!: string;
  public isPublic!: boolean;
  public isPinned!: boolean;
  public isArchived!: boolean;
  public isDeleted!: boolean;
  public deletedAt?: Date;
  public lastEditedBy?: string;
  public version!: number;
  public wordCount!: number;
  public characterCount!: number;
  public tags!: string[];
  public color?: string;
  public coverImage?: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  public calculateStats(): void {
    const text = this.plainText || '';
    this.wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;
    this.characterCount = text.length;
  }
}

Note.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    title: {
      type: DataTypes.STRING(500),
      allowNull: false,
      defaultValue: 'Untitled',
    },
    content: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    plainText: {
      type: DataTypes.TEXT,
      defaultValue: '',
    },
    ownerId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    isPublic: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    isPinned: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    isArchived: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    isDeleted: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    deletedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    lastEditedBy: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    version: {
      type: DataTypes.INTEGER,
      defaultValue: 1,
    },
    wordCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    characterCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    tags: {
      type: isSQLite ? DataTypes.TEXT : DataTypes.ARRAY(DataTypes.TEXT),
      defaultValue: '[]',
      get() {
        const rawValue = this.getDataValue('tags' as any);
        if (isSQLite) {
          try { return rawValue ? JSON.parse(rawValue as string) : []; } catch { return []; }
        }
        return rawValue || [];
      },
      set(value: string[]) {
        if (isSQLite) {
          (this as any).setDataValue('tags', JSON.stringify(value || []));
        } else {
          (this as any).setDataValue('tags', value || []);
        }
      },
    },
    color: {
      type: DataTypes.STRING(7),
      allowNull: true,
    },
    coverImage: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'notes',
    indexes: [
      { fields: ['owner_id'] },
      { fields: ['is_public'] },
      { fields: ['is_deleted'] },
      { fields: ['created_at'] },
    ],
    paranoid: true,
    deletedAt: 'deleted_at',
  }
);

export default Note;
