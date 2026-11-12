import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  Req,
  Res,
  Render,
  UseGuards,
  UsePipes,
  ValidationPipe,
  ParseIntPipe,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { CatalogService } from '../services/catalog.service';
import { CreateFoodProductDto } from '../models/dto/create-food-product.dto';
import { SearchFoodProductDto } from '../models/dto/search-food-product.dto';
import { AuthenticatedGuard } from '../../../common/guards/authenticated.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';

@Controller('catalog')
export class FoodCatalogController {
  constructor(private readonly catalogService: CatalogService) {}

  /**
   * Catalog Discovery: Search, filter by category/tag, score breakdown
   */
  @Get()
  @Render('areas/food-catalog/views/index')
  async getCatalog(@Query() searchDto: SearchFoodProductDto, @Req() req: Request) {
    const { items, total, page, totalPages } =
      await this.catalogService.searchAndFilter(searchDto);
    const filterOptions = await this.catalogService.getFilterOptions();

    return {
      title: 'Food Catalog & Transparency Score — TrueLabel',
      products: items,
      total,
      page,
      totalPages,
      query: searchDto.q || '',
      selectedCategory: searchDto.category || '',
      selectedTag: searchDto.tag || '',
      minScore: searchDto.minScore || '',
      categories: filterOptions.categories,
      dietaryTags: filterOptions.dietaryTags,
      user: req.session?.user || null,
    };
  }

  /**
   * Barcode Search: Direct lookup or Request-to-Add page
   */
  @Get('barcode/:barcode')
  async searchBarcode(
    @Param('barcode') barcode: string,
    @Res() res: Response,
    @Req() req: Request,
  ) {
    const product = await this.catalogService.findByBarcode(barcode);
    if (product) {
      return res.redirect(`/catalog/product/${product.id}`);
    }
    return res.render('areas/food-catalog/views/not-found', {
      title: 'Barcode Not Found — TrueLabel',
      barcode,
      user: req.session?.user || null,
    });
  }

  /**
   * Product Details: Ingredients, Nutrition Facts, Transparency breakdown
   */
  @Get('product/:id')
  @Render('areas/food-catalog/views/detail')
  async getProductDetail(@Param('id', ParseIntPipe) id: number, @Req() req: Request) {
    const product = await this.catalogService.findById(id);

    // Group ingredients by hazard level for clear presentation
    const allergens = product.ingredients?.filter((i) => i.isAllergen) || [];
    const additives = product.ingredients?.filter((i) => i.additiveCode) || [];

    return {
      title: `${product.name} (${product.brand}) — TrueLabel`,
      product,
      allergens,
      additives,
      isOwner:
        req.session?.user?.role === 'admin' ||
        (req.session?.user?.role === 'manufacturer' &&
          req.session?.user?.id === product.manufacturerId),
      user: req.session?.user || null,
    };
  }

  /**
   * Manufacturer View: Product Creation Form
   */
  @Get('manage/create')
  @UseGuards(AuthenticatedGuard, RolesGuard)
  @Roles('manufacturer', 'admin')
  @Render('areas/food-catalog/views/create')
  async getCreateForm(@Req() req: Request) {
    const filterOptions = await this.catalogService.getFilterOptions();
    return {
      title: 'Submit Food to Catalog — TrueLabel',
      categories: filterOptions.categories,
      dietaryTags: filterOptions.dietaryTags,
      user: req.session?.user,
    };
  }

  /**
   * Process Product Creation Form
   */
  @Post('manage/create')
  @UseGuards(AuthenticatedGuard, RolesGuard)
  @Roles('manufacturer', 'admin')
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async handleCreate(
    @Body() dto: CreateFoodProductDto,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    try {
      const manufacturerId = req.session.user.id;
      const product = await this.catalogService.create(dto, manufacturerId);
      return res.redirect(`/catalog/product/${product.id}`);
    } catch (err) {
      const filterOptions = await this.catalogService.getFilterOptions();
      return res.render('areas/food-catalog/views/create', {
        title: 'Submit Food to Catalog — TrueLabel',
        error: err.message || 'Failed to register product',
        productData: dto,
        categories: filterOptions.categories,
        dietaryTags: filterOptions.dietaryTags,
        user: req.session?.user,
      });
    }
  }

  /**
   * Manufacturer View: Product Edit Form
   */
  @Get('manage/:id/edit')
  @UseGuards(AuthenticatedGuard, RolesGuard)
  @Roles('manufacturer', 'admin')
  @Render('areas/food-catalog/views/edit')
  async getEditForm(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: Request,
  ) {
    const product = await this.catalogService.findById(id);
    const filterOptions = await this.catalogService.getFilterOptions();

    return {
      title: `Edit ${product.name} — TrueLabel`,
      product,
      categories: filterOptions.categories,
      dietaryTags: filterOptions.dietaryTags,
      user: req.session?.user,
    };
  }

  /**
   * Process Product Edit Form
   */
  @Post('manage/:id/edit')
  @UseGuards(AuthenticatedGuard, RolesGuard)
  @Roles('manufacturer', 'admin')
  async handleEdit(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: Partial<CreateFoodProductDto>,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    try {
      await this.catalogService.update(id, dto, req.session.user);
      return res.redirect(`/catalog/product/${id}`);
    } catch (err) {
      const product = await this.catalogService.findById(id);
      const filterOptions = await this.catalogService.getFilterOptions();
      return res.render('areas/food-catalog/views/edit', {
        title: `Edit ${product.name} — TrueLabel`,
        error: err.message || 'Failed to update product',
        product,
        categories: filterOptions.categories,
        dietaryTags: filterOptions.dietaryTags,
        user: req.session?.user,
      });
    }
  }

  /**
   * Process Product Archive
   */
  @Post('manage/:id/archive')
  @UseGuards(AuthenticatedGuard, RolesGuard)
  @Roles('manufacturer', 'admin')
  async handleArchive(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    await this.catalogService.archive(id, req.session.user);
    return res.redirect('/catalog');
  }
}

