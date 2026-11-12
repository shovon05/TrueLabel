import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsNumber,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateIngredientDto {
  @IsNotEmpty({ message: 'Ingredient name is required' })
  @IsString()
  name: string;

  @IsOptional()
  isAllergen?: boolean;

  @IsOptional()
  @IsString()
  allergenType?: string;

  @IsOptional()
  @IsString()
  additiveCode?: string;

  @IsOptional()
  @IsString()
  hazardLevel?: 'safe' | 'caution' | 'warning';
}

export class CreateNutritionFactDto {
  @IsNotEmpty({ message: 'Nutrient name is required' })
  @IsString()
  nutrient: string;

  @IsNotEmpty({ message: 'Amount per 100g is required' })
  @IsNumber()
  amountPer100g: number;

  @IsOptional()
  @IsNumber()
  amountPerServing?: number;

  @IsNotEmpty({ message: 'Unit is required' })
  @IsString()
  unit: string;

  @IsOptional()
  @IsNumber()
  dailyValuePercentage?: number;
}

export class CreateFoodProductDto {
  @IsNotEmpty({ message: 'Food product name is required' })
  @IsString()
  name: string;

  @IsNotEmpty({ message: 'Brand name is required' })
  @IsString()
  brand: string;

  @IsNotEmpty({ message: 'Category is required' })
  @IsString()
  category: string;

  @IsNotEmpty({ message: 'Barcode is required' })
  @IsString()
  barcode: string;

  @IsOptional()
  @IsString()
  imageUrl?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsNumber()
  servingSize?: number;

  @IsOptional()
  @IsString()
  servingUnit?: string;

  @IsOptional()
  @IsArray()
  dietaryTags?: string[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateIngredientDto)
  ingredients?: CreateIngredientDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateNutritionFactDto)
  nutritionFacts?: CreateNutritionFactDto[];
}

