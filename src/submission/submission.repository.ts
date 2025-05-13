import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/common/prisma/prisma.service';
import { FindSubmissionResultsParams } from './submission.type';
import { Prisma } from '@prisma/client';

@Injectable()
export class SubmissionRepository {
  constructor(private prisma: PrismaService) {}

  async findSubmissionResultsByQuery(params: FindSubmissionResultsParams) {
    const { page, size, status, studentId, studentName, orderBy } = params;
    const where: any = {};

    if (status) where.status = status;
    if (studentId) where.studentId = studentId;
    if (studentName) where.student = { name: { contains: studentName } };

    const [data, total] = await Promise.all([
      this.prisma.submissions.findMany({
        where,
        skip: (page - 1) * size,
        take: size,
        orderBy,
        include: {
          student: {
            select: {
              name: true,
            },
          },
        },
      }),
      this.prisma.submissions.count({ where }),
    ]);

    return { data, total };
  }

  async findSubmissionDetail(submissionId: number) {
    return this.prisma.submissions.findUnique({
      where: { id: submissionId, deletedAt: null },
      select: {
        id: true,
        componentType: true,
        status: true,
        submitText: true,
        createdAt: true,
        student: {
          select: {
            name: true,
          },
        },
        analysis: {
          where: { submissionId: submissionId },
          select: {
            score: true,
            feedback: true,
            highlightSubmitText: true,
            highlights: {
              select: {
                text: true,
              },
            },
          },
        },
        media: {
          where: { submissionId: submissionId },
          select: {
            url: true,
            type: true,
            createdAt: true,
          },
        },
      },
    });
  }

  async findSubmissionById(
    submissionId: number,
    tx: Prisma.TransactionClient = this.prisma,
  ) {
    return tx.submissions.findUnique({
      where: { id: submissionId },
    });
  }

  async updateSubmissionStatus(
    submissionId: number,
    status: string,
    tx: Prisma.TransactionClient = this.prisma,
  ) {
    return tx.submissions.update({
      where: { id: submissionId },
      data: { status },
    });
  }

  async getComponentType(componentType: string) {
    return this.prisma.submissionComponentType.findUnique({
      where: { name: componentType },
    });
  }

  async getSubmissionByStudentIdAndComponentType(
    studentId: number,
    componentType: string,
  ) {
    return this.prisma.submissions.findFirst({
      where: {
        studentId: studentId,
        componentType,
      },
    });
  }

  async saveMedia(submissionId: number, type: string, url: string) {
    return this.prisma.submissionMedia.create({
      data: {
        submissionId,
        type,
        url,
      },
    });
  }

  async findFailedSubmissions() {
    return this.prisma.submissions.findMany({
      where: { status: 'FAILED', deletedAt: null },
    });
  }

  async saveSubmission({
    studentId,
    componentType,
    submitText,
  }: {
    studentId: number;
    componentType: string;
    submitText: string;
  }) {
    return this.prisma.submissions.create({
      data: {
        studentId,
        componentType,
        status: 'processing',
        submitText,
      },
    });
  }

  async saveAnalysisResult({
    submissionId,
    score,
    feedback,
    highlightResult,
    highlights,
  }: {
    submissionId: number;
    score: number;
    feedback: string;
    highlightResult: string;
    highlights: string[];
  }) {
    return this.prisma.$transaction(async (tx) => {
      const analysis = await tx.submissionsAnalysis.create({
        data: {
          submissionId,
          score,
          feedback,
          highlightSubmitText: highlightResult,
        },
      });

      for (const text of highlights) {
        await tx.analysisHighlights.create({
          data: {
            submissionAnalysisId: analysis.id,
            text,
          },
        });
      }

      await tx.submissions.update({
        where: { id: submissionId },
        data: { status: 'completed' },
      });
    });
  }

  async createSubmissionLog({
    traceId,
    studentId,
    submissionId,
    latency,
    isSuccess,
    action,
    errorMessage,
  }: {
    traceId: string;
    studentId: number;
    submissionId: number | null;
    latency: number;
    isSuccess?: boolean | null;
    action: string;
    errorMessage?: string;
  }) {
    return this.prisma.submissionLogs.create({
      data: {
        traceId,
        studentId,
        submissionId,
        latency,
        isSuccess,
        action,
        errorMessage: errorMessage || null,
      },
    });
  }
}
