import { Test } from '@nestjs/testing';
import { ReviewService } from '../services/review.service';
import { ReviewController } from './review.controller';

describe('ReviewController (F11)', () => {
  let controller: ReviewController;
  const service = { forProduct: jest.fn(), create: jest.fn(), reply: jest.fn() };

  beforeEach(async () => {
    jest.resetAllMocks();
    const module = await Test.createTestingModule({
      controllers: [ReviewController],
      providers: [{ provide: ReviewService, useValue: service }],
    }).compile();
    controller = module.get(ReviewController);
  });

  it('renders reviews with consumer name and average rating', async () => {
    service.forProduct.mockResolvedValue({
      product: { id: 5, name: 'Oat Milk', manufacturerId: 20 },
      averageRating: '4.0',
      reviews: [{ id: 2, userId: 3, rating: 4, comment: 'Good', author: { name: 'Sam' } }],
    });
    const model = await controller.view(5,
      { session: { user: { id: 3, role: 'consumer' } } } as any);
    expect(model.reviews[0].authorName).toBe('Sam');
    expect(model.averageRating).toBe('4.0');
  });

  it('submits consumer reviews', async () => {
    const response = { redirect: jest.fn() } as any;
    await controller.create(5, { rating: 5, comment: 'Very nice product' },
      { session: { user: { id: 3, role: 'consumer' } } } as any, response);
    expect(service.create).toHaveBeenCalledWith(5, 3, expect.any(Object));
    expect(response.redirect).toHaveBeenCalledWith('/community/products/5/reviews');
  });

  it('redirects after manufacturer response', async () => {
    service.reply.mockResolvedValue({ productId: 5 });
    const response = { redirect: jest.fn() } as any;
    await controller.reply(10, { reply: 'Thank you' },
      { session: { user: { id: 20, role: 'manufacturer' } } } as any, response);
    expect(service.reply).toHaveBeenCalledWith(10, 'Thank you', expect.any(Object));
    expect(response.redirect).toHaveBeenCalledWith('/community/products/5/reviews');
  });
});
