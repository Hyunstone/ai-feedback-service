import { Body, Controller, Post } from '@nestjs/common';
import { RevisionService } from './revision.service';
import { CreateRevisionDto } from './revision.type';

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
}
