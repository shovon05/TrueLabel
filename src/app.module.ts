import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { getDatabaseConfig } from './config/database.config';
import { IdentityModule } from './areas/identity/identity.module';
import { FoodCatalogModule } from './areas/food-catalog/food-catalog.module';
import { PersonalFoodModule } from './areas/personal-food/personal-food.module';
import { SupabaseModule } from './config/supabase.module';
import { SeedService } from './config/seed.service';
import { CommunityModule } from './areas/community/community.module';
import { FoodReview } from './areas/community/models/food-review.entity';
import { FoodReport } from './areas/community/models/food-report.entity';
import { User } from './areas/identity/models/user.entity';
import { FoodProduct } from './areas/food-catalog/models/food-product.entity';
import { Ingredient } from './areas/food-catalog/models/ingredient.entity';
import { NutritionFact } from './areas/food-catalog/models/nutrition-fact.entity';
import { PreferenceProfile } from './areas/personal-food/models/preference-profile.entity';

@Module({
  imports: [
    TypeOrmModule.forRoot(getDatabaseConfig()),
    TypeOrmModule.forFeature([
      User,
      FoodProduct,
      Ingredient,
      NutritionFact,
      PreferenceProfile,
      FoodReview,
      FoodReport,
    ]),
    SupabaseModule,
    IdentityModule,
    FoodCatalogModule,
    PersonalFoodModule,
    CommunityModule,
  ],
  providers: [SeedService],
})
export class AppModule {}

