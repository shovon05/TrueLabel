// Feature F16: Food Preference & Allergen Profile
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PreferenceProfile } from '../models/preference-profile.entity';
import { UpdatePreferenceProfileDto } from '../models/dto/update-preference-profile.dto';
import { FoodProduct } from '../../food-catalog/models/food-product.entity';

export interface ConflictItem {
  category: 'allergen' | 'dietary' | 'nutrition';
  severity: 'critical' | 'warning' | 'info';
  title: string;
  description: string;
  source: string;
}

export interface ConflictEvaluationResult {
  hasConflicts: boolean;
  hasAllergenConflict: boolean;
  hasDietaryConflict: boolean;
  hasNutritionWarning: boolean;
  conflicts: ConflictItem[];
  matchedAllergies: string[];
  dietaryMismatches: string[];
  isSafeForUser: boolean;
  profileConfigured: boolean;
}

export const STANDARD_ALLERGENS = [
  'Peanut',
  'Tree Nuts',
  'Milk',
  'Egg',
  'Gluten',
  'Soy',
  'Fish',
  'Shellfish',
  'Sesame',
];

export const STANDARD_DIETS = [
  'Vegan',
  'Vegetarian',
  'Gluten-Free',
  'Dairy-Free',
  'Halal',
  'Kosher',
  'Keto',
];

@Injectable()
export class PreferenceService {
  constructor(
    @InjectRepository(PreferenceProfile)
    private readonly profileRepo: Repository<PreferenceProfile>,
  ) {}

  /**
   * Find profile by user ID
   */
  async findByUserId(userId: number): Promise<PreferenceProfile | null> {
    return this.profileRepo.findOne({ where: { userId } });
  }

  /**
   * Find or initialize a default profile for user
   */
  async findOrCreate(userId: number): Promise<PreferenceProfile> {
    let profile = await this.findByUserId(userId);
    if (!profile) {
      profile = this.profileRepo.create({
        userId,
        allergies: [],
        dietaryPreferences: [],
        dislikedIngredients: [],
        calorieGoal: null,
        maxSugarPerServing: null,
        maxSodiumPerServing: null,
        minProteinPerServing: null,
      });
      profile = await this.profileRepo.save(profile);
    }
    return profile;
  }

  /**
   * Update or create user's preference and allergen profile
   */
  async updateProfile(
    userId: number,
    dto: UpdatePreferenceProfileDto,
  ): Promise<PreferenceProfile> {
    let profile = await this.findOrCreate(userId);

    if (dto.allergies !== undefined) {
      profile.allergies = dto.allergies;
    }
    if (dto.dietaryPreferences !== undefined) {
      profile.dietaryPreferences = dto.dietaryPreferences;
    }
    if (dto.dislikedIngredients !== undefined) {
      profile.dislikedIngredients = dto.dislikedIngredients;
    }
    if (dto.calorieGoal !== undefined) {
      profile.calorieGoal = dto.calorieGoal ? Number(dto.calorieGoal) : null;
    }
    if (dto.maxSugarPerServing !== undefined) {
      profile.maxSugarPerServing = dto.maxSugarPerServing ? Number(dto.maxSugarPerServing) : null;
    }
    if (dto.maxSodiumPerServing !== undefined) {
      profile.maxSodiumPerServing = dto.maxSodiumPerServing ? Number(dto.maxSodiumPerServing) : null;
    }
    if (dto.minProteinPerServing !== undefined) {
      profile.minProteinPerServing = dto.minProteinPerServing ? Number(dto.minProteinPerServing) : null;
    }
    if (dto.age !== undefined) {
      profile.age = dto.age ? Number(dto.age) : null;
    }
    if (dto.gender !== undefined) {
      profile.gender = (dto.gender || null) as any;
    }
    if (dto.heightCm !== undefined) {
      profile.heightCm = dto.heightCm ? Number(dto.heightCm) : null;
    }
    if (dto.weightKg !== undefined) {
      profile.weightKg = dto.weightKg ? Number(dto.weightKg) : null;
    }
    if (dto.activityLevel !== undefined) {
      profile.activityLevel = (dto.activityLevel || null) as any;
    }

    return this.profileRepo.save(profile);
  }

  /**
   * Evaluate a food product against user's health & allergen profile
   */
  evaluateProductConflict(
    profile: PreferenceProfile | null,
    product: FoodProduct,
  ): ConflictEvaluationResult {
    // If no profile or empty preferences configured
    const isConfigured = Boolean(
      profile &&
        ((profile.allergies && profile.allergies.length > 0) ||
          (profile.dietaryPreferences && profile.dietaryPreferences.length > 0) ||
          (profile.dislikedIngredients && profile.dislikedIngredients.length > 0) ||
          profile.maxSugarPerServing ||
          profile.maxSodiumPerServing),
    );

    if (!isConfigured || !profile) {
      return {
        hasConflicts: false,
        hasAllergenConflict: false,
        hasDietaryConflict: false,
        hasNutritionWarning: false,
        conflicts: [],
        matchedAllergies: [],
        dietaryMismatches: [],
        isSafeForUser: true,
        profileConfigured: false,
      };
    }

    const conflicts: ConflictItem[] = [];
    const matchedAllergies: string[] = [];
    const dietaryMismatches: string[] = [];

    const userAllergies = (profile.allergies || []).map((a) => a.trim().toLowerCase());
    const ingredients = product.ingredients || [];
    const productTags = (product.dietaryTags || []).map((t) => t.trim().toLowerCase());

    // 1. ALLERGEN EVALUATION (Critical Severity)
    for (const allergy of userAllergies) {
      if (!allergy) continue;

      for (const ingredient of ingredients) {
        const ingName = ingredient.name.toLowerCase();
        const ingAllergenType = (ingredient.allergenType || '').toLowerCase();

        const matchesAllergenType =
          ingAllergenType.includes(allergy) || allergy.includes(ingAllergenType && ingAllergenType.length > 2 ? ingAllergenType : '___');
        const matchesName =
          ingName.includes(allergy) ||
          (allergy === 'milk' && (ingName.includes('dairy') || ingName.includes('whey') || ingName.includes('casein') || ingName.includes('butter') || ingName.includes('cheese') || ingName.includes('yogurt'))) ||
          (allergy === 'gluten' && (ingName.includes('wheat') || ingName.includes('barley') || ingName.includes('rye'))) ||
          (allergy === 'tree nuts' && (ingName.includes('almond') || ingName.includes('cashew') || ingName.includes('walnut') || ingName.includes('pistachio') || ingName.includes('hazelnut') || ingName.includes('pecan')));

        if (ingredient.isAllergen && (matchesAllergenType || matchesName)) {
          if (!matchedAllergies.includes(allergy)) {
            matchedAllergies.push(allergy);
          }
          conflicts.push({
            category: 'allergen',
            severity: 'critical',
            title: `Critical Allergen Match: ${ingredient.name}`,
            description: `Contains declared allergen ingredient "${ingredient.name}" (${ingredient.allergenType || allergy}) matching your allergy profile.`,
            source: ingredient.name,
          });
          break;
        } else if (matchesName) {
          if (!matchedAllergies.includes(allergy)) {
            matchedAllergies.push(allergy);
          }
          conflicts.push({
            category: 'allergen',
            severity: 'critical',
            title: `Potential Allergen Match: ${ingredient.name}`,
            description: `Ingredient "${ingredient.name}" contains or is derived from "${allergy}".`,
            source: ingredient.name,
          });
          break;
        }
      }
    }

    // 2. DISLIKED INGREDIENTS
    const disliked = (profile.dislikedIngredients || []).map((d) => d.trim().toLowerCase());
    for (const item of disliked) {
      if (!item) continue;
      for (const ingredient of ingredients) {
        if (ingredient.name.toLowerCase().includes(item)) {
          conflicts.push({
            category: 'dietary',
            severity: 'warning',
            title: `Avoided Ingredient: ${ingredient.name}`,
            description: `Contains "${ingredient.name}", which is on your custom avoid list.`,
            source: ingredient.name,
          });
          break;
        }
      }
    }

    // 3. DIETARY PREFERENCE EVALUATION
    const userDiets = (profile.dietaryPreferences || []).map((d) => d.trim().toLowerCase());

    for (const diet of userDiets) {
      if (!diet) continue;

      if (diet === 'vegan') {
        const isTaggedVegan = productTags.includes('vegan');
        if (!isTaggedVegan) {
          // Check for animal/dairy ingredients
          const animalIngredient = ingredients.find((i) => {
            const n = i.name.toLowerCase();
            return (
              n.includes('milk') ||
              n.includes('egg') ||
              n.includes('honey') ||
              n.includes('gelatin') ||
              n.includes('beef') ||
              n.includes('chicken') ||
              n.includes('pork') ||
              n.includes('fish') ||
              n.includes('whey') ||
              n.includes('cheese') ||
              n.includes('butter')
            );
          });

          if (animalIngredient) {
            dietaryMismatches.push('Vegan');
            conflicts.push({
              category: 'dietary',
              severity: 'warning',
              title: 'Dietary Mismatch: Vegan',
              description: `You prefer a Vegan diet, but this product contains "${animalIngredient.name}" and is not certified vegan.`,
              source: animalIngredient.name,
            });
          }
        }
      }

      if (diet === 'vegetarian') {
        const meatIngredient = ingredients.find((i) => {
          const n = i.name.toLowerCase();
          return (
            n.includes('beef') ||
            n.includes('chicken') ||
            n.includes('pork') ||
            n.includes('fish') ||
            n.includes('gelatin') ||
            n.includes('meat')
          );
        });
        if (meatIngredient) {
          dietaryMismatches.push('Vegetarian');
          conflicts.push({
            category: 'dietary',
            severity: 'warning',
            title: 'Dietary Mismatch: Vegetarian',
            description: `Contains animal-derived ingredient "${meatIngredient.name}".`,
            source: meatIngredient.name,
          });
        }
      }

      if (diet === 'gluten-free') {
        const isTaggedGf = productTags.includes('gluten-free');
        if (!isTaggedGf) {
          const glutenIng = ingredients.find((i) => {
            const n = i.name.toLowerCase();
            return n.includes('wheat') || n.includes('barley') || n.includes('rye') || n.includes('gluten');
          });
          if (glutenIng) {
            dietaryMismatches.push('Gluten-Free');
            conflicts.push({
              category: 'dietary',
              severity: 'warning',
              title: 'Dietary Mismatch: Gluten-Free',
              description: `Product contains "${glutenIng.name}" and is not tagged Gluten-Free.`,
              source: glutenIng.name,
            });
          }
        }
      }

      if (diet === 'dairy-free') {
        const isTaggedDf = productTags.includes('dairy-free') || productTags.includes('vegan');
        if (!isTaggedDf) {
          const dairyIng = ingredients.find((i) => {
            const n = i.name.toLowerCase();
            return (
              n.includes('milk') ||
              n.includes('whey') ||
              n.includes('casein') ||
              n.includes('butter') ||
              n.includes('cheese') ||
              n.includes('yogurt')
            );
          });
          if (dairyIng) {
            dietaryMismatches.push('Dairy-Free');
            conflicts.push({
              category: 'dietary',
              severity: 'warning',
              title: 'Dietary Mismatch: Dairy-Free',
              description: `Product contains dairy ingredient "${dairyIng.name}".`,
              source: dairyIng.name,
            });
          }
        }
      }
    }

    // 4. NUTRITION THRESHOLD EVALUATION
    if (profile.maxSugarPerServing && profile.maxSugarPerServing > 0 && product.nutritionFacts) {
      const sugarFact = product.nutritionFacts.find((n) => n.nutrient.toLowerCase().includes('sugar'));
      if (sugarFact) {
        const servingSugar =
          sugarFact.amountPerServing !== null && sugarFact.amountPerServing !== undefined
            ? sugarFact.amountPerServing
            : (sugarFact.amountPer100g * (product.servingSize || 100)) / 100;

        if (servingSugar > profile.maxSugarPerServing) {
          conflicts.push({
            category: 'nutrition',
            severity: 'info',
            title: 'Sugar Target Exceeded',
            description: `${servingSugar.toFixed(1)}g sugar per serving exceeds your limit of ${profile.maxSugarPerServing}g.`,
            source: 'Nutrition Facts',
          });
        }
      }
    }

    if (profile.maxSodiumPerServing && profile.maxSodiumPerServing > 0 && product.nutritionFacts) {
      const saltFact = product.nutritionFacts.find(
        (n) => n.nutrient.toLowerCase().includes('salt') || n.nutrient.toLowerCase().includes('sodium'),
      );
      if (saltFact) {
        const servingSalt =
          saltFact.amountPerServing !== null && saltFact.amountPerServing !== undefined
            ? saltFact.amountPerServing
            : (saltFact.amountPer100g * (product.servingSize || 100)) / 100;

        if (servingSalt > profile.maxSodiumPerServing) {
          conflicts.push({
            category: 'nutrition',
            severity: 'info',
            title: 'Sodium/Salt Target Exceeded',
            description: `${servingSalt.toFixed(2)}g per serving exceeds your target limit of ${profile.maxSodiumPerServing}g.`,
            source: 'Nutrition Facts',
          });
        }
      }
    }

    const hasAllergenConflict = conflicts.some((c) => c.category === 'allergen');
    const hasDietaryConflict = conflicts.some((c) => c.category === 'dietary');
    const hasNutritionWarning = conflicts.some((c) => c.category === 'nutrition');

    return {
      hasConflicts: conflicts.length > 0,
      hasAllergenConflict,
      hasDietaryConflict,
      hasNutritionWarning,
      conflicts,
      matchedAllergies,
      dietaryMismatches,
      isSafeForUser: !hasAllergenConflict && !hasDietaryConflict,
      profileConfigured: true,
    };
  }
}

