// Feature F16: Food Preference & Allergen Profile
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export type GenderType = 'male' | 'female' | 'other';
export type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';

@Entity('preference_profiles')
export class PreferenceProfile {
  @PrimaryGeneratedColumn()
  id: number;

  @Index({ unique: true })
  @Column({ unique: true })
  userId: number;

  // Declared Major Allergies (e.g. 'Peanut', 'Milk', 'Gluten', 'Soy', 'Tree Nut', 'Egg', 'Fish', 'Shellfish', 'Sesame')
  @Column({ type: 'simple-array', default: '' })
  allergies: string[];

  // Dietary Lifestyles (e.g. 'vegan', 'vegetarian', 'halal', 'kosher', 'gluten-free', 'dairy-free', 'keto')
  @Column({ type: 'simple-array', default: '' })
  dietaryPreferences: string[];

  // Specific disliked or strictly avoided ingredients (free-text list)
  @Column({ type: 'simple-array', default: '' })
  dislikedIngredients: string[];

  // Nutritional Target Thresholds
  @Column({ type: 'float', nullable: true })
  calorieGoal: number | null;

  @Column({ type: 'float', nullable: true })
  maxSugarPerServing: number | null;

  @Column({ type: 'float', nullable: true })
  maxSodiumPerServing: number | null;

  @Column({ type: 'float', nullable: true })
  minProteinPerServing: number | null;

  // Body Metrics Foundation (for Mifflin-St Jeor metabolic computation)
  @Column({ type: 'int', nullable: true })
  age: number | null;

  @Column({ type: 'varchar', length: 20, nullable: true })
  gender: GenderType | null;

  @Column({ type: 'float', nullable: true })
  heightCm: number | null;

  @Column({ type: 'float', nullable: true })
  weightKg: number | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  activityLevel: ActivityLevel | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

