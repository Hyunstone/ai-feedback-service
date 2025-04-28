import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(private readonly jwtService: JwtService) {}

  async login(name: string) {
    const payload = { name };
    return {
      accessToken: this.jwtService.sign(payload),
    };
  }
}
