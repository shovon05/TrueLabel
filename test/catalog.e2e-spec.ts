import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { join } from 'path';
import * as session from 'express-session';
import * as hbs from 'hbs';
import { AppModule } from '../src/app.module';

describe('Food Catalog (E2E Integration Test)', () => {
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

  it('GET /catalog should return 200 OK and render food catalog page', async () => {
    const response = await request(app.getHttpServer())
      .get('/catalog')
      .expect(200);

    expect(response.text).toContain('Food Catalog & Transparency Discovery');
    expect(response.text).toContain('PureHarvest');
    expect(response.text).toContain('Organic Whole Oat Drink');
  });

  it('GET /catalog/barcode/9312345678901 should redirect to product detail page', async () => {
    const response = await request(app.getHttpServer())
      .get('/catalog/barcode/9312345678901')
      .expect(302);

    expect(response.header.location).toContain('/catalog/product/');
  });

  it('GET /catalog/barcode/0000000000000 should render not-found page', async () => {
    const response = await request(app.getHttpServer())
      .get('/catalog/barcode/0000000000000')
      .expect(200);

    expect(response.text).toContain('Barcode Not Found');
    expect(response.text).toContain('0000000000000');
  });

  it('GET /auth/login should render login page', async () => {
    const response = await request(app.getHttpServer())
      .get('/auth/login')
      .expect(200);

    expect(response.text).toContain('Sign In');
    expect(response.text).toContain('consumer@truelabel.demo');
  });

  it('GET /personal/profile without authentication should require login (401)', async () => {
    await request(app.getHttpServer())
      .get('/personal/profile')
      .expect(401);
  });

  it('GET /catalog/product/1 should render product details with F16 health profile hook', async () => {
    const response = await request(app.getHttpServer())
      .get('/catalog/product/1')
      .expect(200);

    expect(response.text).toContain('Organic Whole Oat Drink');
    expect(response.text).toContain('Nutrition Facts');
    expect(response.text).toContain('Declared Ingredients');
  });
});
