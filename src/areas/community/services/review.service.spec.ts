import { BadRequestException, ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Test } from '@nestjs/testing';
import { FoodProduct } from '../../food-catalog/models/food-product.entity';
import { FoodReview } from '../models/food-review.entity';
import { ReviewService } from './review.service';

describe('ReviewService (F11)', () => {
  let service: ReviewService;
  const reviews = { find: jest.fn(), findOne: jest.fn(), create: jest.fn(), save: jest.fn() };
  const products = { findOne: jest.fn() };
  const product = { id: 5, name: 'Oat Milk', status: 'active', manufacturerId: 20 };

  beforeEach(async () => {
    jest.resetAllMocks();
    const module = await Test.createTestingModule({
      providers: [
        ReviewService,
        { provide: getRepositoryToken(FoodReview), useValue: reviews },
        { provide: getRepositoryToken(FoodProduct), useValue: products },
      ],
    }).compile();
    service = module.get(ReviewService);
    products.findOne.mockResolvedValue(product);
    reviews.create.mockImplementation(data => data);
    reviews.save.mockImplementation(async data => data);
  });

  it('lists reviews and calculates the average', async () => {
    reviews.find.mockResolvedValue([{ rating: 5 }, { rating: 3 }]);
    const result = await service.forProduct(5);
    expect(result.averageRating).toBe('4.0');
    expect(result.reviews).toHaveLength(2);
  });

  it('handles a product with no reviews', async () => {
    reviews.find.mockResolvedValue([]);
    expect((await service.forProduct(5)).averageRating).toBeNull();
  });

  it('creates a review for an existing product', async () => {
    reviews.findOne.mockResolvedValue(null);
    await service.create(5, 3, { rating: 4, comment: '  Nice texture and taste  ' });
    expect(reviews.create).toHaveBeenCalledWith(expect.objectContaining({
      productId: 5, userId: 3, rating: 4, comment: 'Nice texture and taste',
    }));
    expect(reviews.save).toHaveBeenCalledTimes(1);
  });

  it('rejects reviews of unknown products', async () => {
    products.findOne.mockResolvedValue(null);
    await expect(service.create(99, 3, { rating: 4, comment: 'Great product' }))
      .rejects.toThrow(NotFoundException);
  });

  it('rejects empty review text', async () => {
    await expect(service.create(5, 3, { rating: 4, comment: '          ' }))
      .rejects.toThrow(BadRequestException);
  });

  it('blocks duplicate reviews', async () => {
    reviews.findOne.mockResolvedValue({ id: 8 });
    await expect(service.create(5, 3, { rating: 5, comment: 'Great product' }))
      .rejects.toThrow(ConflictException);
  });

  it('allows the product manufacturer to reply', async () => {
    reviews.findOne.mockResolvedValue({ id: 10, productId: 5, product });
    await service.reply(10, 'Thanks for the review', { id: 20, role: 'manufacturer' });
    expect(reviews.save).toHaveBeenCalledWith(expect.objectContaining({
      manufacturerReply: 'Thanks for the review',
    }));
  });

  it('blocks a different manufacturer', async () => {
    reviews.findOne.mockResolvedValue({ id: 10, productId: 5, product });
    await expect(service.reply(10, 'Thanks', { id: 30, role: 'manufacturer' }))
      .rejects.toThrow(ForbiddenException);
  });

  it('returns 404 for a missing review', async () => {
    reviews.findOne.mockResolvedValue(null);
    await expect(service.reply(99, 'Thanks', { id: 20, role: 'manufacturer' }))
      .rejects.toThrow(NotFoundException);
  });
});
