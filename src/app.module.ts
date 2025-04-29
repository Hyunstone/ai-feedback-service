import {
  BadRequestException,
  MiddlewareConsumer,
  Module,
  NestModule,
  ValidationPipe,
} from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SubmissionModule } from './submission/submission.module';
import { AuthModule } from './auth/auth.module';
import { RevisionModule } from './revision/revision.module';
import { RequestLoggingMiddleware } from './common/logging/request-logging.middleware';
import { PrismaService } from './common/prisma/prisma.service';
import { APP_FILTER, APP_PIPE } from '@nestjs/core';
import { GlobalExceptionsFilter } from './common/exception/exception.filter';

@Module({
  imports: [
    AuthModule,
    RevisionModule,
    SubmissionModule,
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.example'],
    }),
  ],
  providers: [
    PrismaService,
    {
      provide: APP_PIPE,
      useValue: new ValidationPipe({
        transform: true,
        whitelist: true,
        forbidNonWhitelisted: false,
        validateCustomDecorators: true,
        exceptionFactory: (errors) => {
          return new BadRequestException(errors);
        },
      }),
    },
    {
      provide: APP_FILTER,
      useClass: GlobalExceptionsFilter,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestLoggingMiddleware).forRoutes('*');
  }
}
