import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import * as fs from 'fs';
import * as session from 'express-session';
import * as hbs from 'hbs';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Serve static assets (CSS, images, client scripts)
  app.useStaticAssets(join(__dirname, '..', 'public'));

  // Base views directory: src
  app.setBaseViewsDir(join(__dirname, '..', 'src'));
  app.setViewEngine('hbs');

  // Synchronously register partials so they are guaranteed ready before requests arrive
  const partialsDir = join(__dirname, '..', 'src', 'shared', 'views', 'partials');
  if (fs.existsSync(partialsDir)) {
    const filenames = fs.readdirSync(partialsDir);
    filenames.forEach((filename) => {
      if (filename.endsWith('.hbs')) {
        const matches = /^([^.]+)\.hbs$/.exec(filename);
        if (!matches) return;
        const name = matches[1];
        const template = fs.readFileSync(join(partialsDir, filename), 'utf8');
        hbs.registerPartial(name, template);
        // Also register without leading underscore if named with underscore
        if (name.startsWith('_')) {
          hbs.registerPartial(name.substring(1), template);
        }
      }
    });
  }

  // Also call hbs built-in registerPartials for folder watching
  hbs.registerPartials(partialsDir);

  app.set('view options', {
    layout: 'shared/views/layouts/main',
  });

  // Handlebars Template Helpers
  hbs.registerHelper('eq', (a, b) => a === b);
  hbs.registerHelper('ne', (a, b) => a !== b);
  hbs.registerHelper('or', (a, b) => a || b);
  hbs.registerHelper('and', (a, b) => a && b);
  hbs.registerHelper('gte', (a, b) => a >= b);
  hbs.registerHelper('lte', (a, b) => a <= b);

  // Session Middleware
  app.use(
    session({
      secret: process.env.SESSION_SECRET || 'truelabel_super_secret_session_key_2026',
      resave: false,
      saveUninitialized: false,
      cookie: { maxAge: 24 * 60 * 60 * 1000 },
    }),
  );

  // Root redirect to catalog
  app.getHttpAdapter().get('/', (req: any, res: any) => {
    res.redirect('/catalog');
  });

  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`TrueLabel platform is running live at: http://localhost:${port}/catalog`);
}

bootstrap();
