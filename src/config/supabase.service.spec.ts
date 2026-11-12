import { Test, TestingModule } from '@nestjs/testing';
import { SupabaseService } from './supabase.service';

describe('SupabaseService (Unit Tests)', () => {
  let service: SupabaseService;

  beforeEach(async () => {
    delete process.env.SUPABASE_URL;
    delete process.env.SUPABASE_ANON_KEY;

    const module: TestingModule = await Test.createTestingModule({
      providers: [SupabaseService],
    }).compile();

    service = module.get<SupabaseService>(SupabaseService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should report isConfigured=false when env variables are not present', () => {
    expect(service.isConfigured).toBe(false);
    expect(service.getClient()).toBeNull();
  });

  it('should return error when attempting upload on unconfigured client', async () => {
    const result = await service.uploadFile(
      'labels',
      'test.jpg',
      Buffer.from('fake'),
      'image/jpeg',
    );
    expect(result.error).toContain('not configured');
    expect(result.url).toBeNull();
  });
});

