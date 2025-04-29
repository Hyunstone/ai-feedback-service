import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from 'src/auth/guard/jwt-auth.guard';
import { SubmissionService } from './submission.service';
import { ISubmission, ISubmissionsQuery } from './submission.type';
import { successResponse } from 'src/common/type/common.mapper';

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
    return successResponse(
      await this.submissionService.handleSubmission(request, video),
    );
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  async findSubmissionResults(@Query() query: ISubmissionsQuery) {
    return successResponse(
      await this.submissionService.findSubmissionResultsByQuery(query),
    );
  }

  @Get(':submissionId')
  async findSubmissionDetail(
    @Param('submissionId', ParseIntPipe) submissionId: number,
  ) {
    return successResponse(
      await this.submissionService.findSubmissionDetail(submissionId),
    );
  }
}
