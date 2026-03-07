import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import * as express from 'express';
import { join } from 'path';
import type { NextFunction, Request, Response } from 'express';
import { ApiExceptionFilter } from './common/api-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const expressApp = app.getHttpAdapter().getInstance();
  expressApp.disable('x-powered-by');

  app.use((_req: Request, res: Response, next: NextFunction) => {
    res.setHeader('Referrer-Policy', 'no-referrer');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('Cross-Origin-Resource-Policy', 'same-site');
    next();
  });

  const origins = process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : true;
  app.enableCors({ 
    origin: origins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept']
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      forbidUnknownValues: true,
      transform: true,
      validationError: {
        target: false,
        value: false,
      },
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );
  app.useGlobalFilters(new ApiExceptionFilter());

  // Serve uploaded files statically
  const uploadsPath = join(__dirname, '..', 'uploads');
  app.use('/uploads', express.static(uploadsPath));

  const requiredEnv = ['JWT_SECRET', 'JWT_REFRESH_SECRET'];
  for (const key of requiredEnv) {
    if (!process.env[key]) {
      console.warn(`[bootstrap] Warning: ${key} is not set.`);
    }
  }

  const fallbackPort = 3000;
  const envPort = process.env.PORT ? parseInt(process.env.PORT, 10) : undefined;
  // Some platforms may inject PORT=5432 from a linked Postgres service.
  const isInvalidDbPort = envPort === 5432;
  const port = isInvalidDbPort ? fallbackPort : (envPort ?? fallbackPort);
  // Helpful diagnostics in deployment logs
  console.log(`[bootstrap] NODE_ENV=${process.env.NODE_ENV} PORT=${process.env.PORT} resolvedPort=${port}`);

  await app.listen(port, '0.0.0.0');
  console.log(`[bootstrap] Listening on 0.0.0.0:${port}`);
}
bootstrap();
