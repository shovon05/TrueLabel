import { Injectable, OnApplicationBootstrap } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { User } from '../areas/identity/models/user.entity';
import { FoodProduct } from '../areas/food-catalog/models/food-product.entity';
import { Ingredient } from '../areas/food-catalog/models/ingredient.entity';
import { NutritionFact } from '../areas/food-catalog/models/nutrition-fact.entity';
import { PreferenceProfile } from '../areas/personal-food/models/preference-profile.entity';

@Injectable()
export class SeedService implements OnApplicationBootstrap {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(FoodProduct)
    private readonly productRepo: Repository<FoodProduct>,
    @InjectRepository(Ingredient)
    private readonly ingredientRepo: Repository<Ingredient>,
    @InjectRepository(NutritionFact)
    private readonly nutritionRepo: Repository<NutritionFact>,
    @InjectRepository(PreferenceProfile)
    private readonly preferenceRepo: Repository<PreferenceProfile>,
  ) {}

  async onApplicationBootstrap() {
    await this.seedUsers();
    await this.seedFoodProducts();
    await this.seedPreferenceProfile();
  }

  private async seedPreferenceProfile() {
    const consumer = await this.userRepo.findOne({
      where: { email: 'consumer@truelabel.demo' },
    });
    if (!consumer) return;

    const existing = await this.preferenceRepo.findOne({
      where: { userId: consumer.id },
    });
    if (existing) return;

    await this.preferenceRepo.save(
      this.preferenceRepo.create({
        userId: consumer.id,
        allergies: ['Peanut', 'Milk'],
        dietaryPreferences: ['Vegan'],
        dislikedIngredients: ['High Fructose Corn Syrup'],
        calorieGoal: 2000,
        maxSugarPerServing: 10,
        maxSodiumPerServing: 1.5,
        minProteinPerServing: 10,
        age: 26,
        gender: 'female',
        heightCm: 168,
        weightKg: 58,
        activityLevel: 'moderate',
      }),
    );
  }

  private async seedUsers() {
    const count = await this.userRepo.count();
    if (count > 0) return;

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash('password123', salt);

    const demoUsers = [
      { name: 'Sarah Consumer', email: 'consumer@truelabel.demo', role: 'consumer' as const },
      { name: 'PureHarvest Organics', email: 'manufacturer@truelabel.demo', role: 'manufacturer' as const },
      { name: 'Dr. Marcus Vance (Inspector)', email: 'inspector@truelabel.demo', role: 'inspector' as const },
      { name: 'Lead System Admin', email: 'admin@truelabel.demo', role: 'admin' as const },
    ];

    for (const u of demoUsers) {
      await this.userRepo.save(
        this.userRepo.create({
          ...u,
          passwordHash,
          isVerified: true,
        }),
      );
    }
  }

  private async seedFoodProducts() {
    const count = await this.productRepo.count();
    if (count > 0) return;

    // 1. Organic Oat Drink (High score, vegan, clean label)
    const oatMilk = await this.productRepo.save(
      this.productRepo.create({
        name: 'Organic Whole Oat Drink (Unsweetened)',
        brand: 'PureHarvest',
        category: 'Dairy & Plant Milks',
        barcode: '9312345678901',
        description: 'Naturally sweet whole oat drink with filtered water and cold-pressed sunflower oil.',
        servingSize: 200,
        servingUnit: 'ml',
        status: 'active',
        qualityScore: 92,
        manufacturerId: 2,
        dietaryTags: ['Vegan', 'Gluten-Free', 'Organic'],
      }),
    );

    await this.ingredientRepo.save([
      this.ingredientRepo.create({ name: 'Filtered Water', hazardLevel: 'safe', product: oatMilk }),
      this.ingredientRepo.create({ name: 'Organic Whole Oats (14%)', hazardLevel: 'safe', product: oatMilk }),
      this.ingredientRepo.create({ name: 'Organic Cold-Pressed Sunflower Oil', hazardLevel: 'safe', product: oatMilk }),
      this.ingredientRepo.create({ name: 'Sea Salt', hazardLevel: 'safe', product: oatMilk }),
    ]);

    await this.nutritionRepo.save([
      this.nutritionRepo.create({ nutrient: 'Energy', amountPer100g: 48, unit: 'kcal', product: oatMilk }),
      this.nutritionRepo.create({ nutrient: 'Fat', amountPer100g: 1.5, unit: 'g', product: oatMilk }),
      this.nutritionRepo.create({ nutrient: 'Saturated Fat', amountPer100g: 0.2, unit: 'g', product: oatMilk }),
      this.nutritionRepo.create({ nutrient: 'Carbohydrates', amountPer100g: 7.8, unit: 'g', product: oatMilk }),
      this.nutritionRepo.create({ nutrient: 'Sugars', amountPer100g: 3.8, unit: 'g', product: oatMilk }),
      this.nutritionRepo.create({ nutrient: 'Protein', amountPer100g: 1.1, unit: 'g', product: oatMilk }),
      this.nutritionRepo.create({ nutrient: 'Salt', amountPer100g: 0.1, unit: 'g', product: oatMilk }),
    ]);

    // 2. Crunchy Roasted Peanut Butter (Allergen: Peanut, High protein)
    const peanutButter = await this.productRepo.save(
      this.productRepo.create({
        name: 'Crunchy Roasted Peanut Butter',
        brand: 'NutriFarm',
        category: 'Pantry & Condiments',
        barcode: '8901234567891',
        description: '100% dry-roasted hi-oleic peanuts with a pinch of pink Himalayan rock salt.',
        servingSize: 25,
        servingUnit: 'g',
        status: 'active',
        qualityScore: 84,
        manufacturerId: 2,
        dietaryTags: ['Vegan', 'Gluten-Free', 'Kosher'],
      }),
    );

    await this.ingredientRepo.save([
      this.ingredientRepo.create({
        name: 'Roasted Peanuts',
        isAllergen: true,
        allergenType: 'Peanut',
        hazardLevel: 'caution',
        explanation: 'Known major allergen for sensitized individuals.',
        product: peanutButter,
      }),
      this.ingredientRepo.create({ name: 'Himalayan Pink Salt (0.5%)', hazardLevel: 'safe', product: peanutButter }),
    ]);

    await this.nutritionRepo.save([
      this.nutritionRepo.create({ nutrient: 'Energy', amountPer100g: 596, unit: 'kcal', product: peanutButter }),
      this.nutritionRepo.create({ nutrient: 'Fat', amountPer100g: 48.0, unit: 'g', product: peanutButter }),
      this.nutritionRepo.create({ nutrient: 'Saturated Fat', amountPer100g: 6.2, unit: 'g', product: peanutButter }),
      this.nutritionRepo.create({ nutrient: 'Carbohydrates', amountPer100g: 12.0, unit: 'g', product: peanutButter }),
      this.nutritionRepo.create({ nutrient: 'Sugars', amountPer100g: 5.1, unit: 'g', product: peanutButter }),
      this.nutritionRepo.create({ nutrient: 'Protein', amountPer100g: 27.5, unit: 'g', product: peanutButter }),
      this.nutritionRepo.create({ nutrient: 'Salt', amountPer100g: 0.48, unit: 'g', product: peanutButter }),
    ]);

    // 3. Greek Natural Yogurt (Allergen: Milk)
    const yogurt = await this.productRepo.save(
      this.productRepo.create({
        name: 'Authentic Strained Greek Yogurt',
        brand: 'Olympus Valley',
        category: 'Dairy & Plant Milks',
        barcode: '5201234567892',
        description: 'Traditional strained whole cow milk yogurt with live probiotic cultures.',
        servingSize: 150,
        servingUnit: 'g',
        status: 'active',
        qualityScore: 90,
        manufacturerId: 2,
        dietaryTags: ['Vegetarian', 'Gluten-Free', 'Halal'],
      }),
    );

    await this.ingredientRepo.save([
      this.ingredientRepo.create({
        name: 'Pasteurized Whole Milk',
        isAllergen: true,
        allergenType: 'Milk',
        hazardLevel: 'safe',
        product: yogurt,
      }),
      this.ingredientRepo.create({
        name: 'Live Active Yogurt Cultures (L. bulgaricus, S. thermophilus)',
        hazardLevel: 'safe',
        product: yogurt,
      }),
    ]);

    await this.nutritionRepo.save([
      this.nutritionRepo.create({ nutrient: 'Energy', amountPer100g: 125, unit: 'kcal', product: yogurt }),
      this.nutritionRepo.create({ nutrient: 'Fat', amountPer100g: 10.0, unit: 'g', product: yogurt }),
      this.nutritionRepo.create({ nutrient: 'Saturated Fat', amountPer100g: 6.8, unit: 'g', product: yogurt }),
      this.nutritionRepo.create({ nutrient: 'Carbohydrates', amountPer100g: 3.5, unit: 'g', product: yogurt }),
      this.nutritionRepo.create({ nutrient: 'Sugars', amountPer100g: 3.5, unit: 'g', product: yogurt }),
      this.nutritionRepo.create({ nutrient: 'Protein', amountPer100g: 9.0, unit: 'g', product: yogurt }),
      this.nutritionRepo.create({ nutrient: 'Salt', amountPer100g: 0.1, unit: 'g', product: yogurt }),
    ]);

    // 4. Sparkling Citrus Lemonade (High sugar, additive E150d)
    const soda = await this.productRepo.save(
      this.productRepo.create({
        name: 'Sparkling Dark Citrus Soda',
        brand: 'FizzCraft',
        category: 'Beverages',
        barcode: '7612345678903',
        description: 'Carbonated beverage with citrus flavouring and caramel color.',
        servingSize: 330,
        servingUnit: 'ml',
        status: 'active',
        qualityScore: 54, // Lower score due to high sugar and additives
        manufacturerId: 2,
        dietaryTags: ['Vegan'],
      }),
    );

    await this.ingredientRepo.save([
      this.ingredientRepo.create({ name: 'Carbonated Water', hazardLevel: 'safe', product: soda }),
      this.ingredientRepo.create({ name: 'High Fructose Corn Syrup', hazardLevel: 'caution', product: soda }),
      this.ingredientRepo.create({
        name: 'Caramel Color',
        additiveCode: 'E150d',
        hazardLevel: 'caution',
        explanation: 'Sulphite ammonia caramel additive used for dark coloration.',
        product: soda,
      }),
      this.ingredientRepo.create({
        name: 'Phosphoric Acid',
        additiveCode: 'E338',
        hazardLevel: 'caution',
        product: soda,
      }),
    ]);

    await this.nutritionRepo.save([
      this.nutritionRepo.create({ nutrient: 'Energy', amountPer100g: 42, unit: 'kcal', product: soda }),
      this.nutritionRepo.create({ nutrient: 'Fat', amountPer100g: 0, unit: 'g', product: soda }),
      this.nutritionRepo.create({ nutrient: 'Saturated Fat', amountPer100g: 0, unit: 'g', product: soda }),
      this.nutritionRepo.create({ nutrient: 'Carbohydrates', amountPer100g: 10.6, unit: 'g', product: soda }),
      this.nutritionRepo.create({ nutrient: 'Sugars', amountPer100g: 10.6, unit: 'g', product: soda }),
      this.nutritionRepo.create({ nutrient: 'Protein', amountPer100g: 0, unit: 'g', product: soda }),
      this.nutritionRepo.create({ nutrient: 'Salt', amountPer100g: 0.02, unit: 'g', product: soda }),
    ]);
  }
}

