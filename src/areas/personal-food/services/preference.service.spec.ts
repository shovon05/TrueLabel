// Feature F16: Food Preference & Allergen Profile
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PreferenceService } from './preference.service';
import { PreferenceProfile } from '../models/preference-profile.entity';
import { FoodProduct } from '../../food-catalog/models/food-product.entity';
import { Ingredient } from '../../food-catalog/models/ingredient.entity';
import { NutritionFact } from '../../food-catalog/models/nutrition-fact.entity';

describe('PreferenceService (Unit Tests)', () => {
  let service: PreferenceService;
  let repo: jest.Mocked<Repository<PreferenceProfile>>;

  const mockProfile: PreferenceProfile = {
    id: 1,
    userId: 10,
    allergies: ['Peanut', 'Milk'],
    dietaryPreferences: ['Vegan'],
    dislikedIngredients: ['Cilantro'],
    calorieGoal: 2000,
    maxSugarPerServing: 5,
    maxSodiumPerServing: 1.5,
    minProteinPerServing: 10,
    age: 28,
    gender: 'female',
    heightCm: 165,
    weightKg: 60,
    activityLevel: 'moderate',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const mockRepo = {
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PreferenceService,
        {
          provide: getRepositoryToken(PreferenceProfile),
          useValue: mockRepo,
        },
      ],
    }).compile();

    service = module.get<PreferenceService>(PreferenceService);
    repo = module.get(getRepositoryToken(PreferenceProfile));
  });

  describe('findByUserId', () => {
    it('should return the user profile when found (Arrange-Act-Assert)', async () => {
      // Arrange
      repo.findOne.mockResolvedValue(mockProfile);

      // Act
      const result = await service.findByUserId(10);

      // Assert
      expect(result).toEqual(mockProfile);
      expect(repo.findOne).toHaveBeenCalledWith({ where: { userId: 10 } });
    });

    it('should return null when profile does not exist', async () => {
      // Arrange
      repo.findOne.mockResolvedValue(null);

      // Act
      const result = await service.findByUserId(99);

      // Assert
      expect(result).toBeNull();
    });
  });

  describe('findOrCreate', () => {
    it('should return existing profile if present', async () => {
      // Arrange
      repo.findOne.mockResolvedValue(mockProfile);

      // Act
      const result = await service.findOrCreate(10);

      // Assert
      expect(result).toEqual(mockProfile);
      expect(repo.create).not.toHaveBeenCalled();
    });

    it('should create and save a new profile if not found', async () => {
      // Arrange
      repo.findOne.mockResolvedValue(null);
      const newProfile = { ...mockProfile, id: 2, userId: 20, allergies: [] };
      repo.create.mockReturnValue(newProfile);
      repo.save.mockResolvedValue(newProfile);

      // Act
      const result = await service.findOrCreate(20);

      // Assert
      expect(result).toEqual(newProfile);
      expect(repo.create).toHaveBeenCalled();
      expect(repo.save).toHaveBeenCalled();
    });
  });

  describe('updateProfile', () => {
    it('should update and persist modified fields', async () => {
      // Arrange
      repo.findOne.mockResolvedValue({ ...mockProfile });
      repo.save.mockImplementation(async (entity) => entity as PreferenceProfile);

      const updateDto = {
        allergies: ['Gluten', 'Soy'],
        dietaryPreferences: ['Keto'],
        maxSugarPerServing: 2,
      };

      // Act
      const result = await service.updateProfile(10, updateDto);

      // Assert
      expect(result.allergies).toEqual(['Gluten', 'Soy']);
      expect(result.dietaryPreferences).toEqual(['Keto']);
      expect(result.maxSugarPerServing).toBe(2);
      expect(repo.save).toHaveBeenCalled();
    });
  });

  describe('evaluateProductConflict', () => {
    const baseProduct: FoodProduct = {
      id: 1,
      name: 'Organic Oat Milk',
      brand: 'PureHarvest',
      category: 'Dairy & Plant Milks',
      barcode: '1234567890123',
      imageUrl: '',
      description: 'Clean oat milk',
      servingSize: 200,
      servingUnit: 'ml',
      status: 'active',
      qualityScore: 90,
      manufacturerId: 1,
      dietaryTags: ['Vegan', 'Gluten-Free'],
      ingredients: [
        {
          id: 1,
          name: 'Filtered Water',
          isAllergen: false,
          allergenType: '',
          additiveCode: '',
          hazardLevel: 'safe',
          explanation: '',
          product: null as any,
        },
        {
          id: 2,
          name: 'Organic Whole Oats',
          isAllergen: false,
          allergenType: '',
          additiveCode: '',
          hazardLevel: 'safe',
          explanation: '',
          product: null as any,
        },
      ],
      nutritionFacts: [
        {
          id: 1,
          nutrient: 'Sugars',
          amountPer100g: 2.0,
          amountPerServing: 4.0,
          unit: 'g',
          dailyValuePercentage: 4,
          product: null as any,
        },
      ],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it('should return unconfigured status when profile is null', () => {
      // Act
      const result = service.evaluateProductConflict(null, baseProduct);

      // Assert
      expect(result.profileConfigured).toBe(false);
      expect(result.isSafeForUser).toBe(true);
      expect(result.hasConflicts).toBe(false);
    });

    it('should detect a critical allergen conflict when product contains declared allergen', () => {
      // Arrange: Product with peanut allergen
      const peanutProduct: FoodProduct = {
        ...baseProduct,
        name: 'Peanut Butter Granola',
        dietaryTags: [],
        ingredients: [
          {
            id: 3,
            name: 'Roasted Peanuts',
            isAllergen: true,
            allergenType: 'Peanut',
            additiveCode: '',
            hazardLevel: 'warning',
            explanation: 'Known allergen',
            product: null as any,
          },
        ],
      };

      // Act
      const result = service.evaluateProductConflict(mockProfile, peanutProduct);

      // Assert
      expect(result.hasAllergenConflict).toBe(true);
      expect(result.hasConflicts).toBe(true);
      expect(result.isSafeForUser).toBe(false);
      expect(result.matchedAllergies).toContain('peanut');
    });

    it('should detect a dietary mismatch when user is Vegan but product contains dairy', () => {
      // Arrange: Dairy product
      const dairyProduct: FoodProduct = {
        ...baseProduct,
        name: 'Dairy Yogurt',
        dietaryTags: [],
        ingredients: [
          {
            id: 4,
            name: 'Pasteurized Whole Milk',
            isAllergen: true,
            allergenType: 'Milk',
            additiveCode: '',
            hazardLevel: 'caution',
            explanation: '',
            product: null as any,
          },
        ],
      };

      // Act
      const result = service.evaluateProductConflict(mockProfile, dairyProduct);

      // Assert
      expect(result.hasDietaryConflict).toBe(true);
      expect(result.dietaryMismatches).toContain('Vegan');
      expect(result.isSafeForUser).toBe(false);
    });

    it('should detect when sugar per serving exceeds user preference limit', () => {
      // Arrange: High sugar product (12g per serving > user limit of 5g)
      const highSugarProduct: FoodProduct = {
        ...baseProduct,
        dietaryTags: ['Vegan'],
        nutritionFacts: [
          {
            id: 2,
            nutrient: 'Sugars',
            amountPer100g: 6,
            amountPerServing: 12,
            unit: 'g',
            dailyValuePercentage: 15,
            product: null as any,
          },
        ],
      };

      // Act
      const result = service.evaluateProductConflict(mockProfile, highSugarProduct);

      // Assert
      expect(result.hasNutritionWarning).toBe(true);
      expect(result.conflicts.some((c) => c.category === 'nutrition')).toBe(true);
    });

    it('should return safe clearance for compliant product with zero conflicts', () => {
      // Act
      const result = service.evaluateProductConflict(mockProfile, baseProduct);

      // Assert
      expect(result.isSafeForUser).toBe(true);
      expect(result.hasConflicts).toBe(false);
      expect(result.hasAllergenConflict).toBe(false);
      expect(result.hasDietaryConflict).toBe(false);
    });

    it('should handle edge cases cleanly (empty ingredients and missing nutrition facts)', () => {
      // Arrange: Empty product
      const emptyProduct: FoodProduct = {
        ...baseProduct,
        ingredients: [],
        nutritionFacts: [],
      };

      // Act
      const result = service.evaluateProductConflict(mockProfile, emptyProduct);

      // Assert
      expect(result).toBeDefined();
      expect(result.hasAllergenConflict).toBe(false);
    });
  });
});

