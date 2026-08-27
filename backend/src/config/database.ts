import { Sequelize } from 'sequelize';
import { config } from './index';
import { logger } from '../utils/logger';
import path from 'path';

const isDev = config.nodeEnv === 'development';
const useSQLite = isDev && config.db.host === 'localhost';

let sequelize: Sequelize;

if (useSQLite) {
  // Use SQLite for local development (no PostgreSQL needed)
  const dbPath = path.join(process.cwd(), 'database.sqlite');
  sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: dbPath,
    logging: (msg) => logger.debug(msg),
    define: {
      timestamps: true,
      underscored: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    },
  });
  logger.info(`Using SQLite database at ${dbPath}`);
} else {
  // Use PostgreSQL for production
  sequelize = new Sequelize(
    config.db.name,
    config.db.user,
    config.db.password,
    {
      host: config.db.host,
      port: config.db.port,
      dialect: 'postgres',
      logging: isDev ? (msg) => logger.debug(msg) : false,
      pool: {
        max: 20,
        min: 5,
        acquire: 60000,
        idle: 10000,
      },
      define: {
        timestamps: true,
        underscored: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at',
      },
    }
  );
}

export { sequelize };

export const connectDB = async (): Promise<void> => {
  try {
    await sequelize.authenticate();
    logger.info('Database connected successfully');

    if (isDev) {
      await sequelize.sync({ alter: true });
      logger.info('Database synced');
    }
  } catch (error) {
    logger.error('Unable to connect to database:', error);
    process.exit(1);
  }
};
