import { Body, Controller, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { ILoginRequest } from './auth.type';
import { successResponse } from 'src/common/type/common.mapper';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('Auth')
@Controller('/api/v1/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @ApiOperation({ summary: '임시로그인 (JWT 발급)' })
  @ApiResponse({ status: 201, description: '토큰 발급 성공' })
  @Post('login')
  async login(@Body() body: ILoginRequest) {
    return successResponse(await this.authService.login(body.name));
  }
}
