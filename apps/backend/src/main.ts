import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const origins = process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : true;
  app.enableCors({ origin: origins });

  app.useGlobalPipes(new ValidationPipe({ whitelist: true }));

  const fallbackPort = 3000;
  const envPort = process.env.PORT ? parseInt(process.env.PORT, 10) : undefined;
  // Some platforms may inject PORT=5432 from a linked Postgres service.
  const isInvalidDbPort = envPort === 5432;
  const port = isInvalidDbPort ? fallbackPort : (envPort ?? fallbackPort);
  // Helpful diagnostics in deployment logs
  // eslint-disable-next-line no-console
  console.log(`[bootstrap] NODE_ENV=${process.env.NODE_ENV} PORT=${process.env.PORT} resolvedPort=${port}`);

  await app.listen(port, '0.0.0.0');
  // eslint-disable-next-line no-console
  console.log(`[bootstrap] Listening on 0.0.0.0:${port}`);
}
bootstrap();