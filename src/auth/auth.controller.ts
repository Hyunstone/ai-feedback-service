import { Body, Controller, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { ILoginRequest } from './auth.type';
import { successResponse } from 'src/common/type/common.mapper';

@Controller('/api/v1/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  async login(@Body() body: ILoginRequest) {
    return successResponse(await this.authService.login(body.name));
  }
}
