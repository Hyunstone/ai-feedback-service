import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SubmissionModule } from './submission/submission.module';
import { AuthModule } from './auth/auth.module';
import { RevisionModule } from './revision/revision.module';
import { RequestLoggingMiddleware } from './common/logging/request-logging.middleware';
import { PrismaService } from './common/prisma/prisma.service';

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
  providers: [PrismaService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestLoggingMiddleware).forRoutes('*');
  }
}
