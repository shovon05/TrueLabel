import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FoodProduct } from './models/food-product.entity';
import { Ingredient } from './models/ingredient.entity';
import { NutritionFact } from './models/nutrition-fact.entity';
import { CatalogService } from './services/catalog.service';
import { FoodCatalogController } from './controllers/food-catalog.controller';

@Module({
  imports: [TypeOrmModule.forFeature([FoodProduct, Ingredient, NutritionFact])],
  controllers: [FoodCatalogController],
  providers: [CatalogService],
  exports: [CatalogService],
})
export class FoodCatalogModule {}

