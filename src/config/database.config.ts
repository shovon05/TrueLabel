import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import * as dotenv from 'dotenv';

dotenv.config();

export const getDatabaseConfig = (): TypeOrmModuleOptions => {
  const databaseUrl = process.env.DATABASE_URL || process.env.SUPABASE_DB_URL;
  const isPostgres = process.env.DB_TYPE === 'postgres' || Boolean(databaseUrl);

  // Supabase / PostgreSQL Cloud Database
  if (isPostgres) {
    if (databaseUrl) {
      return {
        type: 'postgres',
        url: databaseUrl,
        ssl: process.env.DB_SSL === 'false' ? false : { rejectUnauthorized: false },
        autoLoadEntities: true,
        synchronize: true, // Creates tables and syncs schema automatically
      };
    }

    return {
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432', 10),
      username: process.env.DB_USERNAME || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
      database: process.env.DB_NAME || 'postgres',
      ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
      autoLoadEntities: true,
      synchronize: true,
    };
  }

  // Fallback: sql.js WebAssembly SQLite (offline local development & instant testing)
  return {
    type: 'sqljs',
    autoSave: true,
    location: process.env.DB_DATABASE || 'truelabel_dev.sqlite',
    autoLoadEntities: true,
    synchronize: true,
  };
};
