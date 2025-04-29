import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

export function SwaggerConfig(app: INestApplication) {
  const config = new DocumentBuilder()
    .setTitle('AI Feedback API')
    .setDescription('AI 피드백 서비스 API 문서입니다.')
    .setVersion('1.0.0')
    .addBearerAuth(
      { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      'access-token',
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('/api-docs', app, document);
}

export const swaggerConfig = new DocumentBuilder()
  .setTitle('AI Feedback API')
  .setDescription('API documentation for AI Feedback')
  .setVersion('1.0')
  .build();
