import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';

export class CreateRevisionDto {
  @ApiProperty({ description: '제출 ID' })
  @IsNotEmpty()
  @IsInt()
  submissionId: number;
}

export class FindRevisionsQueryDto {
  @ApiProperty({ description: '페이지 번호', example: 1, required: false })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiProperty({
    description: '페이지당 아이템 수',
    example: 20,
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  size?: number = 20;

  @ApiProperty({
    description: '정렬 기준',
    example: 'createdAt,DESC',
    required: false,
  })
  @IsOptional()
  @IsString()
  sort?: string = 'createdAt,DESC';
}
