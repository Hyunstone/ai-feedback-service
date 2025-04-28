import { IsString } from 'class-validator';

export class ILoginRequest {
  @IsString()
  name: string;
}
