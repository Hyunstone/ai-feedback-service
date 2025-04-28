import {
  Body,
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  Get,
  Query,
  UseGuards,
  Param,
  ParseIntPipe,
} from '@nestjs/common';
import { SubmissionService } from './submission.service';
import { ISubmission, ISubmissionsQuery } from './submission.type';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from 'src/auth/guard/jwt-auth.guard';

@Controller('/api/v1/submissions')
export class SubmissionController {
  constructor(private readonly submissionService: SubmissionService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('videoFile'))
  async submit(
    @UploadedFile() video: Express.Multer.File,
    @Body() request: ISubmission,
  ): Promise<any> {
    return await this.submissionService.handleSubmission(request, video);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  async findSubmissionResults(@Query() query: ISubmissionsQuery) {
    return this.submissionService.findSubmissionResultsByQuery(query);
  }

  @Get(':submissionId')
  async findSubmissionDetail(
    @Param('submissionId', ParseIntPipe) submissionId: number,
  ) {
    return this.submissionService.findSubmissionDetail(submissionId);
  }
}
