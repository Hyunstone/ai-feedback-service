import { Module } from '@nestjs/common';
import { SchedulerService } from './scheduler.service';
import { SchedulerRepository } from './scheduler.repository';
import { PrismaService } from 'src/common/prisma/prisma.service';

@Module({
  providers: [SchedulerService, SchedulerRepository, PrismaService],
})
export class SchedulerModule {}
