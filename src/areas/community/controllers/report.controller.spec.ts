import { Test } from '@nestjs/testing';
import { ReportService } from '../services/report.service';
import { ReportController } from './report.controller';

describe('ReportController (F13)', () => {
  let controller: ReportController;
  const service = {
    getProduct: jest.fn(), create: jest.fn(), forConsumer: jest.fn(),
    queue: jest.fn(), updateStatus: jest.fn(),
  };
  const consumer = { session: { user: { id: 3, role: 'consumer' } } } as any;

  beforeEach(async () => {
    jest.resetAllMocks();
    const module = await Test.createTestingModule({
      controllers: [ReportController],
      providers: [{ provide: ReportService, useValue: service }],
    }).compile();
    controller = module.get(ReportController);
  });

  it('renders a form for the selected product', async () => {
    service.getProduct.mockResolvedValue({ id: 5, name: 'Oat Milk' });
    const result = await controller.form(5, consumer);
    expect(result.product.id).toBe(5);
  });

  it('saves a complaint and returns to personal reports', async () => {
    const response = { redirect: jest.fn() } as any;
    await controller.create(5,
      { category: 'expired', description: 'Package was expired' },
      consumer, response);
    expect(service.create).toHaveBeenCalledWith(5, 3, expect.any(Object));
    expect(response.redirect).toHaveBeenCalledWith('/community/reports/mine');
  });

  it('loads personal complaints for the current user', async () => {
    service.forConsumer.mockResolvedValue([]);
    await controller.mine(consumer);
    expect(service.forConsumer).toHaveBeenCalledWith(3);
  });

  it('loads the restricted staff queue', async () => {
    service.queue.mockResolvedValue([{ id: 7 }]);
    const view = await controller.queue(
      { session: { user: { id: 9, role: 'inspector' } } } as any);
    expect(view.reports).toHaveLength(1);
  });

  it('updates the report status through the service', async () => {
    const response = { redirect: jest.fn() } as any;
    await controller.status(7, { status: 'investigating' },
      { session: { user: { id: 9, role: 'inspector' } } } as any, response);
    expect(service.updateStatus).toHaveBeenCalledWith(7, 'investigating', 'inspector');
    expect(response.redirect).toHaveBeenCalledWith('/community/reports/queue');
  });
});
