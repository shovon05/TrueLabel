import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FoodProduct } from '../food-catalog/models/food-product.entity';
import { FoodReview } from './models/food-review.entity';
import { FoodReport } from './models/food-report.entity';
import { ReviewController } from './controllers/review.controller';
import { ReportController } from './controllers/report.controller';
import { ReviewService } from './services/review.service';
import { ReportService } from './services/report.service';

// F11/F13: Consumer reviews and private product complaints.
@Module({
  imports: [TypeOrmModule.forFeature([FoodReview, FoodReport, FoodProduct])],
  controllers: [ReviewController, ReportController],
  providers: [ReviewService, ReportService],
})
export class CommunityModule {}
