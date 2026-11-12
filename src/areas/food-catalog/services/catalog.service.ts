import {
  Injectable,
  ConflictException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FoodProduct } from '../models/food-product.entity';
import { Ingredient } from '../models/ingredient.entity';
import { NutritionFact } from '../models/nutrition-fact.entity';
import { CreateFoodProductDto } from '../models/dto/create-food-product.dto';
import { SearchFoodProductDto } from '../models/dto/search-food-product.dto';

@Injectable()
export class CatalogService {
  constructor(
    @InjectRepository(FoodProduct)
    private readonly productRepo: Repository<FoodProduct>,
    @InjectRepository(Ingredient)
    private readonly ingredientRepo: Repository<Ingredient>,
    @InjectRepository(NutritionFact)
    private readonly nutritionRepo: Repository<NutritionFact>,
  ) {}

  /**
   * Search and filter food catalog (Feature F01)
   * Only active products are visible in discovery.
   */
  async searchAndFilter(dto: SearchFoodProductDto): Promise<{
    items: FoodProduct[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const page = Math.max(1, dto.page || 1);
    const limit = Math.max(1, Math.min(50, dto.limit || 12));
    const skip = (page - 1) * limit;

    const queryBuilder = this.productRepo
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.ingredients', 'ingredients')
      .leftJoinAndSelect('product.nutritionFacts', 'nutritionFacts')
      .where('product.status = :status', { status: 'active' });

    if (dto.q && dto.q.trim()) {
      const q = `%${dto.q.trim().toLowerCase()}%`;
      queryBuilder.andWhere(
        '(LOWER(product.name) LIKE :q OR LOWER(product.brand) LIKE :q OR product.barcode LIKE :barcodeQ)',
        { q, barcodeQ: `%${dto.q.trim()}%` },
      );
    }

    if (dto.category && dto.category.trim()) {
      queryBuilder.andWhere('LOWER(product.category) = :cat', {
        cat: dto.category.trim().toLowerCase(),
      });
    }

    if (dto.minScore) {
      queryBuilder.andWhere('product.qualityScore >= :minScore', {
        minScore: dto.minScore,
      });
    }

    queryBuilder.orderBy('product.createdAt', 'DESC').skip(skip).take(limit);

    const [items, total] = await queryBuilder.getManyAndCount();

    // In-memory filter for dietaryTags if tag is specified
    let filteredItems = items;
    if (dto.tag && dto.tag.trim()) {
      const tagLower = dto.tag.trim().toLowerCase();
      filteredItems = items.filter((p) =>
        p.dietaryTags?.some((t) => t.toLowerCase() === tagLower),
      );
    }

    return {
      items: filteredItems,
      total,
      page,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  /**
   * Find product by exact barcode (Feature F01)
   */
  async findByBarcode(barcode: string): Promise<FoodProduct | null> {
    const cleanBarcode = barcode.trim();
    return this.productRepo.findOne({
      where: { barcode: cleanBarcode, status: 'active' },
      relations: ['ingredients', 'nutritionFacts'],
    });
  }

  /**
   * Find product by ID with full details (Feature F01)
   */
  async findById(id: number): Promise<FoodProduct> {
    const product = await this.productRepo.findOne({
      where: { id },
      relations: ['ingredients', 'nutritionFacts'],
    });

    if (!product) {
      throw new NotFoundException(`Food product with ID ${id} not found`);
    }

    return product;
  }

  /**
   * Create a new food product (Feature F01)
   * Enforces barcode uniqueness across the catalog.
   */
  async create(
    dto: CreateFoodProductDto,
    manufacturerId: number,
  ): Promise<FoodProduct> {
    const cleanBarcode = dto.barcode.trim();
    const existing = await this.productRepo.findOne({
      where: { barcode: cleanBarcode },
    });

    if (existing) {
      throw new ConflictException(
        `A food product with barcode "${cleanBarcode}" already exists in the catalog`,
      );
    }

    // Baseline provisional Food Quality Score (70-90 default, refined in F04)
    let baselineScore = 75;
    if (dto.ingredients && dto.ingredients.length > 0) {
      const cautionCount = dto.ingredients.filter(
        (i) => i.hazardLevel === 'caution' || i.hazardLevel === 'warning',
      ).length;
      baselineScore = Math.max(40, 85 - cautionCount * 10);
    }

    const product = this.productRepo.create({
      name: dto.name.trim(),
      brand: dto.brand.trim(),
      category: dto.category.trim(),
      barcode: cleanBarcode,
      imageUrl: dto.imageUrl || '/images/default-food.png',
      description: dto.description?.trim(),
      servingSize: dto.servingSize || 100,
      servingUnit: dto.servingUnit || 'g',
      status: 'active',
      qualityScore: baselineScore,
      manufacturerId,
      dietaryTags: dto.dietaryTags || [],
    });

    const savedProduct = await this.productRepo.save(product);

    if (dto.ingredients && dto.ingredients.length > 0) {
      const ingredients = dto.ingredients.map((i) =>
        this.ingredientRepo.create({
          ...i,
          name: i.name.trim(),
          product: savedProduct,
        }),
      );
      savedProduct.ingredients = await this.ingredientRepo.save(ingredients);
    }

    if (dto.nutritionFacts && dto.nutritionFacts.length > 0) {
      const facts = dto.nutritionFacts.map((n) =>
        this.nutritionRepo.create({
          ...n,
          product: savedProduct,
        }),
      );
      savedProduct.nutritionFacts = await this.nutritionRepo.save(facts);
    }

    return savedProduct;
  }

  /**
   * Update food product (Feature F01)
   * Manufacturers can edit ONLY their own products. Admins can edit any.
   */
  async update(
    id: number,
    dto: Partial<CreateFoodProductDto>,
    user: { id: number; role: string },
  ): Promise<FoodProduct> {
    const product = await this.findById(id);

    if (user.role === 'manufacturer' && product.manufacturerId !== user.id) {
      throw new ForbiddenException(
        'Manufacturers are only permitted to edit their own food products',
      );
    }

    if (dto.barcode && dto.barcode.trim() !== product.barcode) {
      const collision = await this.productRepo.findOne({
        where: { barcode: dto.barcode.trim() },
      });
      if (collision && collision.id !== id) {
        throw new ConflictException(
          `Barcode "${dto.barcode.trim()}" is already assigned to another food`,
        );
      }
      product.barcode = dto.barcode.trim();
    }

    if (dto.name) product.name = dto.name.trim();
    if (dto.brand) product.brand = dto.brand.trim();
    if (dto.category) product.category = dto.category.trim();
    if (dto.description !== undefined) product.description = dto.description?.trim();
    if (dto.imageUrl) product.imageUrl = dto.imageUrl;
    if (dto.servingSize) product.servingSize = dto.servingSize;
    if (dto.servingUnit) product.servingUnit = dto.servingUnit;
    if (dto.dietaryTags) product.dietaryTags = dto.dietaryTags;

    return this.productRepo.save(product);
  }

  /**
   * Archive food product (Feature F01)
   * Hidden from discovery but kept in history.
   */
  async archive(id: number, user: { id: number; role: string }): Promise<FoodProduct> {
    const product = await this.findById(id);

    if (user.role === 'manufacturer' && product.manufacturerId !== user.id) {
      throw new ForbiddenException(
        'Manufacturers are only permitted to archive their own food products',
      );
    }

    product.status = 'archived';
    return this.productRepo.save(product);
  }

  /**
   * Get unique categories and dietary tags for filters
   */
  async getFilterOptions(): Promise<{ categories: string[]; dietaryTags: string[] }> {
    return {
      categories: [
        'Dairy & Plant Milks',
        'Beverages',
        'Bakery & Bread',
        'Snacks & Confectionery',
        'Cereals & Breakfast',
        'Pantry & Condiments',
        'Packaged Meals',
      ],
      dietaryTags: ['Vegan', 'Vegetarian', 'Gluten-Free', 'Halal', 'Kosher', 'Low-Sugar', 'Organic'],
    };
  }
}

