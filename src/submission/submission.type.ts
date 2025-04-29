import { Type } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export const SubmissionStatus = {
  PENDING: 'PENDING',
  PROCESSING: 'PROCESSING',
  COMPLETED: 'COMPLETED',
  FAILED: 'FAILED',
} as const;

export class ISubmission {
  @IsInt()
  @IsNotEmpty()
  studentId: number;

  @IsString()
  @IsNotEmpty()
  studentName: string;

  @IsString()
  @IsNotEmpty()
  componentType: string;

  @IsString()
  @IsNotEmpty()
  submitText: string;
}

export class ISubmissionsQuery {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  size?: number = 20;

  @IsOptional()
  @IsString()
  sort?: string = 'createdAt,DESC';

  @IsOptional()
  @IsIn(Object.values(SubmissionStatus))
  status?: (typeof SubmissionStatus)[keyof typeof SubmissionStatus];

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  studentId?: number;

  @IsOptional()
  @IsString()
  studentName?: string;
}

export interface FindSubmissionResultsParams {
  page: number;
  size: number;
  status?: string;
  studentId?: number;
  studentName?: string;
  orderBy: Record<string, 'asc' | 'desc'>;
}

export interface IFeedbackRequest {
  componentType: string;
  submitText: string;
}

export interface OFeedBackResultType {
  score: number;
  feedback: string;
  highlights: string[];
}

export interface RevisionLogProperties {
  traceId: string;
  submissionId: number;
  startTime: number;
}

export interface LogIdProperites {
  traceId: string;
  studentId: number;
  submissionId: number;
  startTime: number;
}

export function toLogIdProperties(
  traceId: string,
  studentId: number,
  submissionId: number,
  startTime: number,
): LogIdProperites {
  return {
    traceId,
    studentId,
    submissionId,
    startTime,
  };
}

export function toAiFeedBackType(chat: string): OFeedBackResultType {
  const lines = chat.split('\n');
  const score = parseInt(lines[0].split(':')[1].trim());
  const feedback = lines[1].split(':')[1].trim();
  const highlights = lines.slice(2).map((line) => line.trim());
  const result = { score, feedback, highlights };

  if (!isAiFeedBackType(result)) {
    throw new Error('Invalid AI feedback format');
  }

  return result;
}

function isAiFeedBackType(obj: any): boolean {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    typeof obj.score === 'number' &&
    typeof obj.feedback === 'string' &&
    Array.isArray(obj.highlights) &&
    obj.highlights.every((item: any) => typeof item === 'string')
  );
}
