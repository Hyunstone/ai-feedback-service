import { IsInt, IsNotEmpty, IsString } from 'class-validator';

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

export interface AiFeedBackType {
  score: number;
  feedback: string;
  highlights: string[];
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

export function toAiFeedBackType(chat: string): AiFeedBackType {
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
