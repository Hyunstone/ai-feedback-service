import {
  Body,
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { SubmissionService } from './submission.service';
import { ISubmission } from './submission.type';
import { FileInterceptor } from '@nestjs/platform-express';

@Controller('/api/v1/submissions')
export class SubmissionController {
  constructor(private readonly submissionService: SubmissionService) {}

  @Post()
  @UseInterceptors(FileInterceptor('videoFile'))
  async submit(
    @UploadedFile() video: Express.Multer.File,
    @Body() request: ISubmission,
  ): Promise<any> {
    const result = await this.submissionService.handleSubmission(
      request,
      video,
    );
    return {
      result: result.result,
      traceId: result.traceId,
      submissionId: result.submissionId,
    };
  }
}
