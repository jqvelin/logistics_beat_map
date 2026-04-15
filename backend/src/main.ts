import 'dotenv/config';
import { writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api');
  app.enableCors();
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Logistics Beat Map API')
    .setDescription('REST API для мобильной обучающей платформы по логистике')
    .setVersion('1.0.0')
    .addBearerAuth()
    .build();
  const openApiDocument = SwaggerModule.createDocument(app, swaggerConfig);

  SwaggerModule.setup('docs', app, openApiDocument, {
    useGlobalPrefix: true,
    jsonDocumentUrl: 'openapi.json',
  });

  const outputPath = join(process.cwd(), 'openapi.json');
  await writeFile(outputPath, JSON.stringify(openApiDocument, null, 2), 'utf8');

  await app.listen(process.env.PORT ?? 3000);
}

void bootstrap();
