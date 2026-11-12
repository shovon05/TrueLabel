import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { FoodProduct } from './food-product.entity';

@Entity('nutrition_facts')
export class NutritionFact {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 50 })
  nutrient: string; // 'Energy', 'Fat', 'Saturated Fat', 'Carbohydrates', 'Sugars', 'Protein', 'Salt', 'Fiber'

  @Column({ type: 'float' })
  amountPer100g: number;

  @Column({ type: 'float', nullable: true })
  amountPerServing: number;

  @Column({ length: 20, default: 'g' })
  unit: string; // 'kcal', 'g', 'mg'

  @Column({ type: 'float', nullable: true })
  dailyValuePercentage: number; // e.g. 15% DV

  @ManyToOne(() => FoodProduct, (product) => product.nutritionFacts, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'productId' })
  product: FoodProduct;
}

