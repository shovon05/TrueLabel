import {
  Controller, Get, Post, Body, Param, ParseIntPipe, Req, Res,
  Render, UseGuards, UsePipes, ValidationPipe,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ReviewService } from '../services/review.service';
import { CreateReviewDto, ReplyToReviewDto } from '../models/dto/create-review.dto';
import { AuthenticatedGuard } from '../../../common/guards/authenticated.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';

@Controller('community')
export class ReviewController {
  constructor(private readonly reviews: ReviewService) {}

  // F11: Anyone can read reviews.
  @Get('products/:productId/reviews')
  @Render('areas/community/views/reviews')
  async view(@Param('productId', ParseIntPipe) id: number, @Req() req: Request) {
    const { product, reviews, averageRating } = await this.reviews.forProduct(id);
    const user = req.session?.user || null;
    const canReply = user?.role === 'admin' ||
      (user?.role === 'manufacturer' && user.id === product.manufacturerId);
    return {
      title: 'Reviews for ' + product.name + ' — TrueLabel',
      product, reviews: reviews.map((review) => ({
        id: review.id, rating: review.rating, title: review.title,
        comment: review.comment, manufacturerReply: review.manufacturerReply,
        authorName: review.author?.name || 'Consumer',
        postedOn: review.createdAt?.toLocaleDateString('en-GB') || '',
        canReply,
      })),
      averageRating, user, canReview: user?.role === 'consumer',
    };
  }

  // F11: Signed-in consumer submits a review.
  @Post('products/:productId/reviews')
  @UseGuards(AuthenticatedGuard, RolesGuard)
  @Roles('consumer')
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async create(
    @Param('productId', ParseIntPipe) id: number,
    @Body() dto: CreateReviewDto, @Req() req: Request, @Res() res: Response,
  ) {
    await this.reviews.create(id, req.session.user.id, dto);
    return res.redirect('/community/products/' + id + '/reviews');
  }

  // F11: Manufacturer or admin response.
  @Post('reviews/:reviewId/reply')
  @UseGuards(AuthenticatedGuard, RolesGuard)
  @Roles('manufacturer', 'admin')
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async reply(
    @Param('reviewId', ParseIntPipe) id: number,
    @Body() dto: ReplyToReviewDto, @Req() req: Request, @Res() res: Response,
  ) {
    const review = await this.reviews.reply(id, dto.reply, req.session.user);
    return res.redirect('/community/products/' + review.productId + '/reviews');
  }
}
