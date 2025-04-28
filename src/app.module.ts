import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SubmissionModule } from './submission/submission.module';

@Module({
  imports: [
    SubmissionModule,
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.example'],
    }),
  ],
  providers: [],
})
export class AppModule {}
