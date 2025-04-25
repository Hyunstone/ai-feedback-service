import { Injectable, Logger } from '@nestjs/common';
import { uploadToAzureBlob } from 'src/common/storage/azure.storage';
import { processVideoFile } from 'src/common/video/video.util';
import { SubmissionRepository } from './submission.repository';
import { ISubmission } from './submission.type';

@Injectable()
export class SubmissionService {
  constructor(private repository: SubmissionRepository) {}
  private readonly logger = new Logger(SubmissionService.name);

  async handleSubmission(request: ISubmission, video?: Express.Multer.File) {
    const traceId = crypto.randomUUID();
    const start = Date.now();
    try {
      this.validateSubmission(request);
      const submission = await this.repository.saveSubmission({
        studentId: request.studentId,
        componentType: request.componentType,
        submitText: request.submitText,
      });

      // 영상 전처리 -> AzureBlobStorage 저장
      if (video) {
        const { croppedVideoPath, audioPath } = await processVideoFile(video);
        try {
          const [croppedUrl, audioUrl] = await Promise.all([
            uploadToAzureBlob(croppedVideoPath),
            uploadToAzureBlob(audioPath),
          ]);

          await Promise.all([
            this.repository.saveMedia({
              submissionId: submission.id,
              type: 'video',
              url: croppedUrl,
            }),
            this.repository.saveMedia({
              submissionId: submission.id,
              type: 'audio',
              url: audioUrl,
            }),
          ]);

          this.logger.log('영상, 음성 업로드 및 DB 저장 완료');
        } catch (err) {
          this.logger.error('uploading to Azure Blob Storage:', err);
        }
      }

      // 바로 평가 로직 수행
      await this.repository.saveAnalysisResult({
        submissionId: submission.id,
        score: 87,
        feedback: '문법 오류 2건 발견. 주제 일관성 양호.',
        highlight_submit_text: '문법 오류 부분 강조된 텍스트입니다.',
        highlights: ['grammar error: "a apple" → "an apple"'],
      });

      await this.repository.createSubmissionLog({
        traceId,
        studentId: request.studentId,
        submissionId: submission.id,
        isSuccess: true,
        latency: Date.now() - start,
        action: 'evaluate',
      });

      return {
        result: 'success',
        traceId,
        submissionId: submission.id,
      };
    } catch (e) {
      await this.repository.createSubmissionLog({
        traceId,
        studentId: request.studentId,
        submissionId: null,
        isSuccess: false,
        latency: Date.now() - start,
        action: 'evaluate',
        errorMessage: e.message,
      });

      return {
        result: 'failed',
        traceId,
        message: e.message,
      };
    }
  }

  private validateSubmission(body: ISubmission) {
    if (!this.repository.getComponentType(body.componentType)) {
      throw new Error('잘못된 과제 유형입니다.');
    }
    if (
      !this.repository.getComponentTypeByStudentId(
        body.studentId,
        body.componentType,
      )
    ) {
      throw new Error('학생이 작성할 수 없는 과제입니다.');
    }
  }
}
