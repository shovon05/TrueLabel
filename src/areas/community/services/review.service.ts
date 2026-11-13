import {
  BadRequestException, ConflictException, ForbiddenException,
  Injectable, NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FoodProduct } from '../../food-catalog/models/food-product.entity';
import { FoodReview } from '../models/food-review.entity';
import { CreateReviewDto } from '../models/dto/create-review.dto';

@Injectable()
export class ReviewService {
  constructor(
    @InjectRepository(FoodReview)
    private readonly reviewRepo: Repository<FoodReview>,
    @InjectRepository(FoodProduct)
    private readonly productRepo: Repository<FoodProduct>,
  ) {}

  // F11: List reviews and calculate a consumer average, separate from quality score.
  async forProduct(productId: number) {
    const product = await this.requireProduct(productId);
    const reviews = await this.reviewRepo.find({
      where: { productId },
      relations: ['author'],
      order: { createdAt: 'DESC' },
    });
    const sum = reviews.reduce((total, review) => total + review.rating, 0);
    const averageRating = reviews.length ? (sum / reviews.length).toFixed(1) : null;
    return { product, reviews, averageRating };
  }

  // F11: Do not allow more than one review from the same user.
  async create(productId: number, userId: number, dto: CreateReviewDto) {
    await this.requireProduct(productId);
    if (!dto.comment?.trim() || dto.comment.trim().length < 10) {
      throw new BadRequestException('Write at least 10 characters in your review');
    }
    const existing = await this.reviewRepo.findOne({ where: { productId, userId } });
    if (existing) throw new ConflictException('You have already reviewed this product');

    const review = this.reviewRepo.create({
      productId, userId, rating: dto.rating,
      title: dto.title?.trim() || '',
      comment: dto.comment.trim(),
    });
    return this.reviewRepo.save(review);
  }

  // F11: Only the product's manufacturer (or admin) may reply.
  async reply(reviewId: number, message: string, user: { id: number; role: string }) {
    const review = await this.reviewRepo.findOne({
      where: { id: reviewId }, relations: ['product'],
    });
    if (!review) throw new NotFoundException('Review not found');
    if (user.role !== 'admin' &&
        (user.role !== 'manufacturer' || review.product.manufacturerId !== user.id)) {
      throw new ForbiddenException('You cannot reply to this review');
    }
    if (!message?.trim() || message.trim().length < 2) {
      throw new BadRequestException('Response is too short');
    }
    review.manufacturerReply = message.trim();
    review.repliedAt = new Date().toISOString();
    return this.reviewRepo.save(review);
  }

  private async requireProduct(id: number) {
    const product = await this.productRepo.findOne({
      where: { id, status: 'active' },
    });
    if (!product) throw new NotFoundException('Food product not found');
    return product;
  }
}
