import {
  Body,
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  Get,
  Query,
} from '@nestjs/common';
import { SubmissionService } from './submission.service';
import { ISubmission, ISubmissionsQuery } from './submission.type';
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
    return await this.submissionService.handleSubmission(request, video);
  }

  @Get()
  async findSubmissionResults(@Query() query: ISubmissionsQuery) {
    return this.submissionService.findSubmissionResultsByQuery(query);
  }
}
