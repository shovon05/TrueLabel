import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import * as dotenv from 'dotenv';
import { User } from '../areas/identity/models/user.entity';
import { FoodProduct } from '../areas/food-catalog/models/food-product.entity';
import { Ingredient } from '../areas/food-catalog/models/ingredient.entity';
import { NutritionFact } from '../areas/food-catalog/models/nutrition-fact.entity';
import { PreferenceProfile } from '../areas/personal-food/models/preference-profile.entity';
import { FoodReview } from '../areas/community/models/food-review.entity';
import { FoodReport } from '../areas/community/models/food-report.entity';

dotenv.config();

const ALL_ENTITIES = [
  User,
  FoodProduct,
  Ingredient,
  NutritionFact,
  PreferenceProfile,
  FoodReview,
  FoodReport,
];

export const getDatabaseConfig = (): TypeOrmModuleOptions => {
  const databaseUrl = process.env.DATABASE_URL || process.env.SUPABASE_DB_URL;
  const isPostgres = process.env.DB_TYPE === 'postgres' || Boolean(databaseUrl);

  // Supabase / PostgreSQL Cloud Database — Single Source of Truth
  if (isPostgres && databaseUrl) {
    return {
      type: 'postgres',
      url: databaseUrl,
      ssl: process.env.DB_SSL === 'false' ? false : { rejectUnauthorized: false },
      entities: ALL_ENTITIES,
      autoLoadEntities: true,
      synchronize: process.env.DB_SYNC === 'true', // Only enable on an isolated development DB
      extra: {
        max: 10,
        connectionTimeoutMillis: 10000,
      },
    };
  }

  if (isPostgres) {
    return {
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432', 10),
      username: process.env.DB_USERNAME || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
      database: process.env.DB_NAME || 'postgres',
      ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
      entities: ALL_ENTITIES,
      autoLoadEntities: true,
      synchronize: process.env.DB_SYNC === 'true',
      extra: {
        max: 10,
        connectionTimeoutMillis: 10000,
      },
    };
  }

  // Fallback: sql.js WebAssembly SQLite (offline local test harness only when no DATABASE_URL is set)
  return {
    type: 'sqljs',
    autoSave: true,
    location: process.env.DB_DATABASE || 'truelabel_dev.sqlite',
    entities: ALL_ENTITIES,
    autoLoadEntities: true,
    synchronize: true,
  };
};
