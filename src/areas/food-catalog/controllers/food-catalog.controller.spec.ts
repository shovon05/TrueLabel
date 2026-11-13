import { Test, TestingModule } from '@nestjs/testing';
import { FoodCatalogController } from './food-catalog.controller';
import { CatalogService } from '../services/catalog.service';
import { PreferenceService } from '../../personal-food/services/preference.service';

describe('FoodCatalogController (Unit Tests)', () => {
  let controller: FoodCatalogController;
  let catalogService: jest.Mocked<Partial<CatalogService>>;
  let preferenceService: jest.Mocked<Partial<PreferenceService>>;

  const mockProduct = {
    id: 1,
    name: 'Pure Oat Milk',
    brand: 'OatLand',
    category: 'Dairy & Plant Milks',
    barcode: '8901234567890',
    status: 'active' as const,
    qualityScore: 88,
    manufacturerId: 10,
    ingredients: [],
    nutritionFacts: [],
  };

  beforeEach(async () => {
    catalogService = {
      searchAndFilter: jest.fn(),
      findByBarcode: jest.fn(),
      findById: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      archive: jest.fn(),
      getFilterOptions: jest.fn().mockResolvedValue({
        categories: ['Dairy & Plant Milks'],
        dietaryTags: ['Vegan'],
      }),
    };

    preferenceService = {
      findByUserId: jest.fn().mockResolvedValue(null),
      evaluateProductConflict: jest.fn().mockReturnValue({
        hasConflicts: false,
        hasAllergenConflict: false,
        hasDietaryConflict: false,
        hasNutritionWarning: false,
        conflicts: [],
        matchedAllergies: [],
        dietaryMismatches: [],
        isSafeForUser: true,
        profileConfigured: false,
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [FoodCatalogController],
      providers: [
        {
          provide: CatalogService,
          useValue: catalogService,
        },
        {
          provide: PreferenceService,
          useValue: preferenceService,
        },
      ],
    }).compile();

    controller = module.get<FoodCatalogController>(FoodCatalogController);
  });

  describe('getCatalog', () => {
    it('should return catalog view model with products and filters', async () => {
      (catalogService.searchAndFilter as jest.Mock).mockResolvedValue({
        items: [mockProduct],
        total: 1,
        page: 1,
        totalPages: 1,
      });

      const mockReq = { session: { user: null } } as any;
      const result = await controller.getCatalog({}, mockReq);

      expect(result.products).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.title).toContain('Food Catalog');
    });
  });

  describe('searchBarcode', () => {
    it('should redirect to product page if barcode exists', async () => {
      (catalogService.findByBarcode as jest.Mock).mockResolvedValue(mockProduct);

      const mockRes = { redirect: jest.fn(), render: jest.fn() } as any;
      const mockReq = { session: {} } as any;

      await controller.searchBarcode('8901234567890', mockRes, mockReq);
      expect(mockRes.redirect).toHaveBeenCalledWith('/catalog/product/1');
    });

    it('should render not-found page if barcode does not exist', async () => {
      (catalogService.findByBarcode as jest.Mock).mockResolvedValue(null);

      const mockRes = { redirect: jest.fn(), render: jest.fn() } as any;
      const mockReq = { session: {} } as any;

      await controller.searchBarcode('999999999', mockRes, mockReq);
      expect(mockRes.render).toHaveBeenCalledWith(
        'areas/food-catalog/views/not-found',
        expect.objectContaining({ barcode: '999999999' }),
      );
    });
  });

  describe('getProductDetail', () => {
    it('should return product details with allergen and additive groupings', async () => {
      const productWithIngr = {
        ...mockProduct,
        ingredients: [
          { name: 'Peanut Paste', isAllergen: true, allergenType: 'Peanut' },
          { name: 'Caramel Color', additiveCode: 'E150d' },
        ],
      };
      (catalogService.findById as jest.Mock).mockResolvedValue(productWithIngr as any);

      const mockReq = { session: { user: { id: 10, role: 'manufacturer' } } } as any;
      const result = await controller.getProductDetail(1, mockReq);

      expect(result.product.name).toBe('Pure Oat Milk');
      expect(result.allergens).toHaveLength(1);
      expect(result.additives).toHaveLength(1);
      expect(result.isOwner).toBe(true);
    });
  });
});

