import { NestFactory } from '@nestjs/core';
import {
  BadRequestException,
  RequestMethod,
  ValidationPipe,
} from '@nestjs/common';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AllExceptionsFilter } from './common/filters/all_exceptions.filter';
import { TransformResponseInterceptor } from './common/interceptors/transform_response.interceptor';
// import * as fs from 'fs';

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
      exceptionFactory: (validationErrors) => {
        const messages = validationErrors.flatMap((error) =>
          Object.values(error.constraints ?? {}),
        );
        return new BadRequestException({
          message: messages[0] ?? 'Validation failed',
          messages,
        });
      },
    }),
  );
  app.useGlobalFilters(new AllExceptionsFilter());
  app.useGlobalInterceptors(new TransformResponseInterceptor());

  // CORS
  const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',').map((o) =>
    o.trim(),
  );
  app.enableCors({
    origin: allowedOrigins ?? false,
    credentials: true,
  });

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
  // fs.writeFileSync('./swagger.json', JSON.stringify(document, null, 2)); // to get json in swagger /api/docs-json

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
