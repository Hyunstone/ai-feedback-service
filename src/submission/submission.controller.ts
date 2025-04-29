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
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('Submissions')
@Controller('/api/v1/submissions')
export class SubmissionController {
  constructor(private readonly submissionService: SubmissionService) {}

  @ApiOperation({ summary: '제출 생성' })
  @ApiResponse({ status: 201, description: '생성 성공' })
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

  @ApiOperation({ summary: '제출 결과 조회' })
  @ApiResponse({ status: 200, description: '조회 성공' })
  @Get()
  @UseGuards(JwtAuthGuard)
  async findSubmissionResults(@Query() query: ISubmissionsQuery) {
    return successResponse(
      await this.submissionService.findSubmissionResultsByQuery(query),
    );
  }

  @ApiOperation({ summary: '제출 상세 조회' })
  @ApiResponse({ status: 200, description: '상세 조회 성공' })
  @Get(':submissionId')
  async findSubmissionDetail(
    @Param('submissionId', ParseIntPipe) submissionId: number,
  ) {
    return successResponse(
      await this.submissionService.findSubmissionDetail(submissionId),
    );
  }
}
