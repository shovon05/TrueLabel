// Feature F06: Food safety documents & licence verification (E2E Integration Test)
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { join } from 'path';
import * as session from 'express-session';
import * as hbs from 'hbs';
import { AppModule } from '../src/app.module';

describe('Food Safety & Licences (E2E Integration Test - F06)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();

    (app as any).setBaseViewsDir(join(__dirname, '..', 'src'));
    (app as any).setViewEngine('hbs');
    hbs.registerPartials(join(__dirname, '..', 'src', 'shared', 'views', 'partials'));
    (app as any).set('view options', {
      layout: 'shared/views/layouts/main',
    });

    hbs.registerHelper('eq', (a, b) => a === b);
    hbs.registerHelper('ne', (a, b) => a !== b);
    hbs.registerHelper('or', (a, b) => a || b);
    hbs.registerHelper('and', (a, b) => a && b);
    hbs.registerHelper('gte', (a, b) => a >= b);
    hbs.registerHelper('lte', (a, b) => a <= b);
    hbs.registerHelper('includes', (arr: any, val: any) => {
      if (!arr) return false;
      if (Array.isArray(arr)) {
        return arr.some((item) => String(item).toLowerCase() === String(val).toLowerCase());
      }
      if (typeof arr === 'string') {
        return arr.toLowerCase().includes(String(val).toLowerCase());
      }
      return false;
    });

    app.use(
      session({
        secret: 'test-secret',
        resave: false,
        saveUninitialized: false,
      }),
    );

    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /safety/documents should return 200 OK and render documents registry', async () => {
    const response = await request(app.getHttpServer())
      .get('/safety/documents')
      .expect(200);

    expect(response.text).toContain('Safety Documents & Verified Accreditations');
    expect(response.text).toContain('Official Food Safety Registry');
  });

  it('GET /safety/documents/upload without authentication should require login (401)', async () => {
    await request(app.getHttpServer())
      .get('/safety/documents/upload')
      .expect(401);
  });

  it('GET /safety/licence/verify should return 200 OK and render verification page', async () => {
    const response = await request(app.getHttpServer())
      .get('/safety/licence/verify')
      .expect(200);

    expect(response.text).toContain('Manufacturer Licence Verification');
    expect(response.text).toContain('Verify Credential');
  });

  it('GET /safety/licence/verify?licenceNumber=BSTI-FOOD-2024-001 should verify valid licence', async () => {
    const response = await request(app.getHttpServer())
      .get('/safety/licence/verify?licenceNumber=BSTI-FOOD-2024-001')
      .expect(200);

    expect(response.text).toContain('Verified Active & In Good Standing');
    expect(response.text).toContain('OatLand Organics Ltd.');
    expect(response.text).toContain('Bangladesh Standards and Testing Institution');
  });
});
