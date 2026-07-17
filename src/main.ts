import { NestFactory } from '@nestjs/core';
import { RequestMethod, ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AllExceptionsFilter } from './common/filters/all_exceptions.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn'],
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );
  app.useGlobalFilters(new AllExceptionsFilter());

  // Set the global prefix for almost all endpoints
  app.setGlobalPrefix('api', {
    exclude: [{ path: 'logs', method: RequestMethod.GET }],
  });

  // Swagger configuration
  const config = new DocumentBuilder()
    .setTitle('Blog Management API')
    .setDescription(
      'API for blog management system with user authentication and post management',
    )
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    customSiteTitle: 'Blog | Swagger',
    swaggerOptions: { docExpansion: 'none' },
  });

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
