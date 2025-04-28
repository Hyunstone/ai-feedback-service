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

@Controller('/api/v1/revision')
export class RevisionController {
  constructor(private readonly revisionService: RevisionService) {}

  @Post()
  async createRevision(@Body() createRevisionDto: CreateRevisionDto) {
    await this.revisionService.createRevision(createRevisionDto);
    return {
      message: 'Revision request submitted successfully',
    };
  }

  @Get()
  async findAllRevisions(@Query() query: FindRevisionsQueryDto) {
    return this.revisionService.findAllRevisions(query);
  }

  @Get(':id')
  async findRevisionById(@Param('id', ParseIntPipe) id: number) {
    return this.revisionService.findRevisionById(id);
  }
}
