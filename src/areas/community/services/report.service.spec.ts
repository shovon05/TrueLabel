import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Test } from '@nestjs/testing';
import { FoodProduct } from '../../food-catalog/models/food-product.entity';
import { FoodReport } from '../models/food-report.entity';
import { ReportService } from './report.service';

describe('ReportService (F13)', () => {
  let service: ReportService;
  const reports = { find: jest.fn(), findOne: jest.fn(), create: jest.fn(), save: jest.fn() };
  const products = { findOne: jest.fn() };

  beforeEach(async () => {
    jest.resetAllMocks();
    const module = await Test.createTestingModule({
      providers: [
        ReportService,
        { provide: getRepositoryToken(FoodReport), useValue: reports },
        { provide: getRepositoryToken(FoodProduct), useValue: products },
      ],
    }).compile();
    service = module.get(ReportService);
    products.findOne.mockResolvedValue({ id: 5, status: 'active' });
    reports.create.mockImplementation(data => data);
    reports.save.mockImplementation(async data => data);
  });

  it('verifies a food exists', async () => {
    expect((await service.getProduct(5)).id).toBe(5);
  });

  it('rejects reports of unknown foods', async () => {
    products.findOne.mockResolvedValue(null);
    await expect(service.getProduct(90)).rejects.toThrow(NotFoundException);
  });

  it('creates a pending report for a consumer', async () => {
    await service.create(5, 3, { category: 'expired', description: '  Package was already past its expiry date  ' });
    expect(reports.create).toHaveBeenCalledWith(expect.objectContaining({
      productId: 5, userId: 3, category: 'expired', status: 'pending',
    }));
    expect(reports.save).toHaveBeenCalledTimes(1);
  });

  it('rejects a report with only spaces', async () => {
    await expect(service.create(5, 3, { category: 'quality', description: '                  ' }))
      .rejects.toThrow(BadRequestException);
  });

  it('filters personal history by the logged in consumer ID', async () => {
    reports.find.mockResolvedValue([]);
    await service.forConsumer(3);
    expect(reports.find).toHaveBeenCalledWith(expect.objectContaining({
      where: { userId: 3 },
    }));
  });

  it('loads the inspection queue', async () => {
    reports.find.mockResolvedValue([{ id: 1 }]);
    expect(await service.queue()).toHaveLength(1);
  });

  it('lets an inspector mark a report investigating', async () => {
    reports.findOne.mockResolvedValue({ id: 7, status: 'pending' });
    await service.updateStatus(7, 'investigating', 'inspector');
    expect(reports.save).toHaveBeenCalledWith({ id: 7, status: 'investigating' });
  });

  it('blocks consumers from changing complaint status', async () => {
    await expect(service.updateStatus(7, 'resolved', 'consumer'))
      .rejects.toThrow(ForbiddenException);
  });

  it('returns 404 if a complaint is missing', async () => {
    reports.findOne.mockResolvedValue(null);
    await expect(service.updateStatus(90, 'resolved', 'admin')).rejects.toThrow(NotFoundException);
  });
});
