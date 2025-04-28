import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from 'src/common/prisma/prisma.service';

@Injectable()
export class RevisionRepository {
  constructor(private prisma: PrismaService) {}

  async createRevision(
    submissionId: number,
    tx: Prisma.TransactionClient = this.prisma,
  ) {
    return tx.revisions.create({
      data: {
        submissionId,
        isSuccess: false,
      },
    });
  }

  async findAll(params: {
    skip: number;
    take: number;
    orderBy: Prisma.RevisionsOrderByWithRelationInput;
  }) {
    return this.prisma.revisions.findMany({
      skip: params.skip,
      take: params.take,
      orderBy: params.orderBy,
    });
  }

  async count() {
    return this.prisma.revisions.count();
  }
}
