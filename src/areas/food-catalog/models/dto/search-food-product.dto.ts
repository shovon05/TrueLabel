import { IsOptional, IsString, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';

export class SearchFoodProductDto {
  @IsOptional()
  @IsString()
  q?: string; // Query: matches name, brand, or barcode

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsString()
  tag?: string; // dietary tag (e.g. vegan, halal, gluten-free)

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  minScore?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  limit?: number = 12;
}

