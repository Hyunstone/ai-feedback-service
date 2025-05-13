import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
} from '@nestjs/common';
import { RevisionService } from './revision.service';
import { CreateRevisionDto, FindRevisionsQueryDto } from './revision.type';
import { successResponse } from 'src/common/type/common.mapper';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('Revisions')
@Controller('/api/v1/revision')
export class RevisionController {
  constructor(private readonly revisionService: RevisionService) {}

  @ApiOperation({ summary: '재평가 요청 생성' })
  @ApiResponse({ status: 201, description: '생성 성공' })
  @Post()
  async createRevision(@Body() createRevisionDto: CreateRevisionDto) {
    await this.revisionService.createRevision(createRevisionDto);
    return successResponse();
  }

  @ApiOperation({ summary: '재평가 요청 상세 조회' })
  @ApiResponse({
    status: 200,
    description: '상세 조회 성공',
  })
  @Get()
  async findAllRevisions(@Query() query: FindRevisionsQueryDto) {
    return successResponse(await this.revisionService.findAllRevisions(query));
  }

  @ApiOperation({ summary: '재평가 요청 전체 조회' })
  @ApiResponse({ status: 200, description: '조회 성공' })
  @Get(':id')
  async findRevisionById(@Param('id', ParseIntPipe) id: number) {
    return successResponse(await this.revisionService.findRevisionById(id));
  }
}
