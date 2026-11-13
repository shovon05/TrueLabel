import {
  BadRequestException, ForbiddenException, Injectable, NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FoodProduct } from '../../food-catalog/models/food-product.entity';
import { FoodReport, ReportStatus } from '../models/food-report.entity';
import { CreateReportDto } from '../models/dto/create-report.dto';

@Injectable()
export class ReportService {
  constructor(
    @InjectRepository(FoodReport)
    private readonly reportRepo: Repository<FoodReport>,
    @InjectRepository(FoodProduct)
    private readonly productRepo: Repository<FoodProduct>,
  ) {}

  // F13: Check the food exists before allowing a complaint.
  async getProduct(productId: number) {
    const product = await this.productRepo.findOne({
      where: { id: productId, status: 'active' },
    });
    if (!product) throw new NotFoundException('Food product not found');
    return product;
  }

  // F13: Reports are private; they are not public consumer reviews.
  async create(productId: number, userId: number, dto: CreateReportDto) {
    await this.getProduct(productId);
    if (!dto.description?.trim() || dto.description.trim().length < 20) {
      throw new BadRequestException('Please explain the problem in more detail');
    }
    const report = this.reportRepo.create({
      productId, userId, category: dto.category,
      description: dto.description.trim(), status: 'pending',
    });
    return this.reportRepo.save(report);
  }

  // F13: Only return reports owned by this consumer.
  async forConsumer(userId: number) {
    return this.reportRepo.find({
      where: { userId }, relations: ['product'],
      order: { createdAt: 'DESC' },
    });
  }

  // F13: Inspectors/admins see the full queue via protected controller.
  async queue() {
    return this.reportRepo.find({
      relations: ['product', 'author'],
      order: { createdAt: 'DESC' },
    });
  }

  // F13: Staff can update complaint investigation status.
  async updateStatus(id: number, status: Exclude<ReportStatus, 'pending'>, role: string) {
    if (role !== 'inspector' && role !== 'admin') {
      throw new ForbiddenException('Only inspectors or admins may update reports');
    }
    const report = await this.reportRepo.findOne({ where: { id } });
    if (!report) throw new NotFoundException('Complaint not found');
    report.status = status;
    return this.reportRepo.save(report);
  }
}
