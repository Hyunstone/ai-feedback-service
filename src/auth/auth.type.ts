import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class ILoginRequest {
  @ApiProperty({
    description: '학생 이름',
    example: 'test',
  })
  @IsString()
  name: string;
}
