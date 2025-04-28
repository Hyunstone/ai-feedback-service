import { IsInt, IsNotEmpty } from 'class-validator';

export class CreateRevisionDto {
  @IsNotEmpty()
  @IsInt()
  submissionId: number;
}
