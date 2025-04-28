import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { AzureOpenAIService } from 'src/common/openai/openai.service';
import { PrismaService } from 'src/common/prisma/prisma.service';
import { uploadToAzureBlob } from 'src/common/storage/azure.storage';
import { serializedReturn } from 'src/common/type/common.mapper';
import { highlightText } from 'src/common/util/string.util';
import { processVideoFile } from 'src/common/video/video.util';
import { SubmissionRepository } from './submission.repository';
import {
  AiFeedBackType,
  ISubmission,
  ISubmissionsQuery,
  LogIdProperites,
  toAiFeedBackType,
  toLogIdProperties,
} from './submission.type';

@Injectable()
export class SubmissionService {
  constructor(
    private readonly openaiService: AzureOpenAIService,
    private readonly repository: SubmissionRepository,
    private readonly prisma: PrismaService,
  ) {}
  private readonly logger = new Logger(SubmissionService.name);

  async handleSubmission(request: ISubmission, video?: Express.Multer.File) {
    const traceId = crypto.randomUUID();
    const start = Date.now();
    try {
      this.validateSubmission(
        request,
        toLogIdProperties(traceId, request.studentId, -1, start), // submissionId이 존재하지 않기 때문에 -1 처리
      );
      const submission = serializedReturn(
        await this.repository.saveSubmission({
          studentId: request.studentId,
          componentType: request.componentType,
          submitText: request.submitText,
        }),
      );

      const submissionId = submission.id;
      const logIdProperites = toLogIdProperties(
        traceId,
        request.studentId,
        submissionId,
        start,
      );

      const { videoUrl, audioUrl } = await this.processAndUploadMedia(
        logIdProperites,
        video,
      );

      const feedbackResult = await this.chatFeedback(logIdProperites, request);
      const highlightResult = highlightText(
        request.submitText,
        feedbackResult.highlights,
      );

      await this.repository.saveAnalysisResult({
        submissionId,
        score: feedbackResult.score,
        feedback: feedbackResult.feedback,
        highlightResult: highlightResult,
        highlights: feedbackResult.highlights,
      });

      await this.repository.createSubmissionLog({
        traceId,
        studentId: request.studentId,
        submissionId,
        latency: Date.now() - start,
        isSuccess: true,
        action: 'evaluate',
      });

      return serializedReturn({
        result: 'ok',
        message: null,
        studentId: request.studentId,
        studentName: request.studentName,
        score: feedbackResult.score,
        feedback: feedbackResult.feedback,
        highlights: feedbackResult.highlights,
        submitText: request.submitText,
        highlighSubmitText: highlightResult,
        mediaUrl: {
          video: videoUrl,
          audio: audioUrl,
        },
        apiLatency: Date.now() - start,
      });
    } catch (e) {
      return {
        result: 'failed',
        traceId,
        message: e.message,
      };
    }
  }

  async findSubmissionResultsByQuery(query: ISubmissionsQuery) {
    const ALLOWED_SORT_FIELDS = [
      'id',
      'studentId',
      'componentType',
      'status',
      'submitText',
      'createdAt',
      'updatedAt',
      'deletedAt',
    ];

    const page = query.page ?? 1;
    const size = query.size ?? 20;
    const { status, studentId, studentName, sort = 'createdAt,DESC' } = query;

    const [sortField, sortOrder] = sort.split(',');
    if (!ALLOWED_SORT_FIELDS.includes(sortField)) {
      throw new BadRequestException(`Invalid sort field: ${sortField}`);
    }

    const safeSortField = ALLOWED_SORT_FIELDS.includes(sortField)
      ? sortField
      : 'createdAt';
    const safeSortOrder = sortOrder?.toLowerCase() === 'asc' ? 'asc' : 'desc';
    const { data, total } = await this.repository.findSubmissionResultsByQuery({
      page,
      size,
      status,
      studentId,
      studentName,
      orderBy: { [safeSortField]: safeSortOrder },
    });

    return serializedReturn({
      page: query.page ?? 1,
      size: query.size ?? 20,
      total,
      data,
    });
  }

  async findSubmissionDetail(submissionId: number) {
    const submission = await this.repository.findSubmissionDetail(submissionId);

    if (!submission) {
      throw new NotFoundException('Submission not found');
    }

    return serializedReturn(submission);
  }

  protected async chatFeedback(
    logIdProperites: LogIdProperites,
    request: ISubmission,
  ): Promise<AiFeedBackType> {
    // TODO: prompt 수정
    try {
      const chat = await this.openaiService.chat([
        {
          role: 'user',
          content: `학생 ${request.studentId}의 ${request.componentType} 과제에 대한 평가를 요청합니다. ${request.submitText}`,
        },
      ]);
      this.createSubmissionLog(logIdProperites, 'openAI');
      return toAiFeedBackType(chat);
    } catch (error) {
      this.createSubmissionLog(logIdProperites, 'openAI', false, error.message);
      throw new HttpException(
        `Azure OpenAI 호출 실패: ${error.response?.data?.error?.message || error.message}`,
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  protected async processAndUploadMedia(
    logIdProperites: LogIdProperites,
    video?: Express.Multer.File,
  ) {
    if (!video) {
      return { videoUrl: undefined, audioUrl: undefined };
    }

    try {
      const { croppedVideoPath, audioPath } = await processVideoFile(video);
      const [videoUrl, audioUrl] = await Promise.all([
        uploadToAzureBlob(croppedVideoPath),
        uploadToAzureBlob(audioPath),
      ]);

      await Promise.all([
        this.repository.saveMedia(
          logIdProperites.submissionId,
          'video',
          videoUrl,
        ),
        this.repository.saveMedia(
          logIdProperites.submissionId,
          'audio',
          audioUrl,
        ),
      ]);

      this.createSubmissionLog(logIdProperites, 'videoUpload');
      return { videoUrl, audioUrl };
    } catch (error) {
      this.createSubmissionLog(
        logIdProperites,
        'videoUpload',
        false,
        error.message,
      );
      throw new Error(`영상 및 음성 파일 처리 중 오류 발생: ${error.message}`);
    }
  }

  private async validateSubmission(
    body: ISubmission,
    logIdProperites: LogIdProperites,
  ) {
    const componentType = await this.repository.getComponentType(
      body.componentType,
    );
    if (!componentType) {
      const errorMessage = `잘못된 과제 유형입니다.`;
      this.createSubmissionLog(
        logIdProperites,
        'validation',
        false,
        errorMessage,
      );
      throw new Error(errorMessage);
    }

    const submission = serializedReturn(
      await this.repository.getSubmissionByStudentIdAndComponentType(
        body.studentId,
        body.componentType,
      ),
    );

    if (!submission) {
      const errorMessage = '학생이 작성할 수 없는 과제입니다.';
      this.createSubmissionLog(
        logIdProperites,
        'validation',
        false,
        errorMessage,
      );
      throw new Error('학생이 작성할 수 없는 과제입니다.');
    }
  }

  async createSubmissionLog(
    logIdProperites: LogIdProperites,
    action: string, // TODO: action constant 화
    isSuccess?: boolean,
    errorMessage?: string,
  ) {
    this.repository
      .createSubmissionLog({
        traceId: logIdProperites.traceId,
        studentId: logIdProperites.studentId,
        submissionId: logIdProperites.submissionId,
        latency: Date.now() - logIdProperites.startTime,
        isSuccess,
        action,
        errorMessage,
      })
      .catch((err) => {
        // TODO: 알림 추가
        this.logger.error(`SubmissionLog 생성 실패: ${err.message}`);
      });
  }
}
