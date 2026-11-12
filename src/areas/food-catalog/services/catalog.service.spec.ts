import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConflictException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { CatalogService } from './catalog.service';
import { FoodProduct } from '../models/food-product.entity';
import { Ingredient } from '../models/ingredient.entity';
import { NutritionFact } from '../models/nutrition-fact.entity';

describe('CatalogService (Unit Tests)', () => {
  let service: CatalogService;
  let productRepo: jest.Mocked<Partial<Repository<FoodProduct>>>;
  let ingredientRepo: jest.Mocked<Partial<Repository<Ingredient>>>;
  let nutritionRepo: jest.Mocked<Partial<Repository<NutritionFact>>>;

  const mockProduct: FoodProduct = {
    id: 1,
    name: 'Pure Oat Milk',
    brand: 'OatLand',
    category: 'Dairy & Plant Milks',
    barcode: '8901234567890',
    imageUrl: '/images/oat-milk.png',
    description: 'Unsweetened whole oat drink',
    servingSize: 200,
    servingUnit: 'ml',
    status: 'active',
    qualityScore: 88,
    manufacturerId: 10,
    dietaryTags: ['Vegan', 'Gluten-Free'],
    ingredients: [],
    nutritionFacts: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    productRepo = {
      findOne: jest.fn(),
      find: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      createQueryBuilder: jest.fn(),
    };

    ingredientRepo = {
      create: jest.fn(),
      save: jest.fn(),
    };

    nutritionRepo = {
      create: jest.fn(),
      save: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CatalogService,
        {
          provide: getRepositoryToken(FoodProduct),
          useValue: productRepo,
        },
        {
          provide: getRepositoryToken(Ingredient),
          useValue: ingredientRepo,
        },
        {
          provide: getRepositoryToken(NutritionFact),
          useValue: nutritionRepo,
        },
      ],
    }).compile();

    service = module.get<CatalogService>(CatalogService);
  });

  describe('create (Feature F01)', () => {
    it('should successfully create a new food product with ingredients and nutrition', async () => {
      // Arrange
      const dto = {
        name: 'Pure Oat Milk',
        brand: 'OatLand',
        category: 'Dairy & Plant Milks',
        barcode: '8901234567890',
        servingSize: 200,
        servingUnit: 'ml',
        dietaryTags: ['Vegan'],
        ingredients: [
          { name: 'Oats', isAllergen: false, hazardLevel: 'safe' as const },
          { name: 'Water', isAllergen: false, hazardLevel: 'safe' as const },
        ],
        nutritionFacts: [
          { nutrient: 'Energy', amountPer100g: 45, unit: 'kcal' },
          { nutrient: 'Sugars', amountPer100g: 3.2, unit: 'g' },
        ],
      };

      (productRepo.findOne as jest.Mock).mockResolvedValue(null);
      (productRepo.create as jest.Mock).mockReturnValue({ ...mockProduct, id: 1 });
      (productRepo.save as jest.Mock).mockResolvedValue({ ...mockProduct, id: 1 });
      (ingredientRepo.create as jest.Mock).mockImplementation((item) => item);
      (ingredientRepo.save as jest.Mock).mockResolvedValue([
        { id: 1, name: 'Oats' },
        { id: 2, name: 'Water' },
      ]);
      (nutritionRepo.create as jest.Mock).mockImplementation((item) => item);
      (nutritionRepo.save as jest.Mock).mockResolvedValue([
        { id: 1, nutrient: 'Energy', amountPer100g: 45 },
      ]);

      // Act
      const result = await service.create(dto, 10);

      // Assert
      expect(result).toBeDefined();
      expect(productRepo.findOne).toHaveBeenCalledWith({
        where: { barcode: '8901234567890' },
      });
      expect(productRepo.save).toHaveBeenCalled();
      expect(ingredientRepo.save).toHaveBeenCalled();
      expect(nutritionRepo.save).toHaveBeenCalled();
    });

    it('should reject creation with ConflictException if barcode is duplicate', async () => {
      // Arrange
      const dto = {
        name: 'Another Food',
        brand: 'BrandX',
        category: 'Snacks',
        barcode: '8901234567890',
      };

      (productRepo.findOne as jest.Mock).mockResolvedValue(mockProduct);

      // Act & Assert
      await expect(service.create(dto, 10)).rejects.toThrow(ConflictException);
      expect(productRepo.save).not.toHaveBeenCalled();
    });
  });

  describe('findByBarcode (Feature F01)', () => {
    it('should return product when active product with barcode exists', async () => {
      // Arrange
      (productRepo.findOne as jest.Mock).mockResolvedValue(mockProduct);

      // Act
      const result = await service.findByBarcode('8901234567890');

      // Assert
      expect(result).toEqual(mockProduct);
      expect(productRepo.findOne).toHaveBeenCalledWith({
        where: { barcode: '8901234567890', status: 'active' },
        relations: ['ingredients', 'nutritionFacts'],
      });
    });

    it('should return null when barcode does not exist (enables request-to-add page)', async () => {
      // Arrange
      (productRepo.findOne as jest.Mock).mockResolvedValue(null);

      // Act
      const result = await service.findByBarcode('0000000000000');

      // Assert
      expect(result).toBeNull();
    });
  });

  describe('findById (Feature F01)', () => {
    it('should return product with full relations when id is found', async () => {
      // Arrange
      (productRepo.findOne as jest.Mock).mockResolvedValue(mockProduct);

      // Act
      const result = await service.findById(1);

      // Assert
      expect(result.id).toBe(1);
    });

    it('should throw NotFoundException when id is not found', async () => {
      // Arrange
      (productRepo.findOne as jest.Mock).mockResolvedValue(null);

      // Act & Assert
      await expect(service.findById(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('update (Feature F01)', () => {
    it('should allow owner manufacturer to update their own product', async () => {
      // Arrange
      (productRepo.findOne as jest.Mock).mockResolvedValue({ ...mockProduct });
      (productRepo.save as jest.Mock).mockImplementation(async (p) => p);

      // Act
      const result = await service.update(
        1,
        { name: 'Updated Oat Milk' },
        { id: 10, role: 'manufacturer' },
      );

      // Assert
      expect(result.name).toBe('Updated Oat Milk');
      expect(productRepo.save).toHaveBeenCalled();
    });

    it('should throw ForbiddenException if manufacturer attempts to update another manufacturer product', async () => {
      // Arrange
      (productRepo.findOne as jest.Mock).mockResolvedValue({
        ...mockProduct,
        manufacturerId: 999, // Different owner
      });

      // Act & Assert
      await expect(
        service.update(1, { name: 'Hack' }, { id: 10, role: 'manufacturer' }),
      ).rejects.toThrow(ForbiddenException);
      expect(productRepo.save).not.toHaveBeenCalled();
    });

    it('should allow admin to update any product', async () => {
      // Arrange
      (productRepo.findOne as jest.Mock).mockResolvedValue({
        ...mockProduct,
        manufacturerId: 999,
      });
      (productRepo.save as jest.Mock).mockImplementation(async (p) => p);

      // Act
      const result = await service.update(
        1,
        { name: 'Admin Edited Name' },
        { id: 1, role: 'admin' },
      );

      // Assert
      expect(result.name).toBe('Admin Edited Name');
    });
  });

  describe('archive (Feature F01)', () => {
    it('should set status to archived when owner requests', async () => {
      // Arrange
      const activeProd = { ...mockProduct, status: 'active' as const };
      (productRepo.findOne as jest.Mock).mockResolvedValue(activeProd);
      (productRepo.save as jest.Mock).mockImplementation(async (p) => p);

      // Act
      const result = await service.archive(1, { id: 10, role: 'manufacturer' });

      // Assert
      expect(result.status).toBe('archived');
      expect(productRepo.save).toHaveBeenCalled();
    });

    it('should throw ForbiddenException when non-owner manufacturer attempts to archive', async () => {
      // Arrange
      (productRepo.findOne as jest.Mock).mockResolvedValue({
        ...mockProduct,
        manufacturerId: 50,
      });

      // Act & Assert
      await expect(
        service.archive(1, { id: 10, role: 'manufacturer' }),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('searchAndFilter (Feature F01)', () => {
    it('should execute query builder and return paginated products', async () => {
      // Arrange
      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([[mockProduct], 1]),
      };
      (productRepo.createQueryBuilder as jest.Mock).mockReturnValue(mockQueryBuilder);

      // Act
      const result = await service.searchAndFilter({ q: 'Oat', category: 'Dairy & Plant Milks' });

      // Assert
      expect(result.items).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(mockQueryBuilder.andWhere).toHaveBeenCalled();
    });
  });
});

