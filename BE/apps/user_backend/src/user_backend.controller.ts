import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { UserBackendService } from './user_backend.service';
import { JwtAuthGuard } from '../../../libs/auth/jwt-auth.guard';

@Controller()
export class UserBackendController {
  constructor(private readonly userBackendService: UserBackendService) {}

  @Get()
  getHello(): string {
    return this.userBackendService.getHello();
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  getProfile(@Request() req) {
    const userId = req.user?.userId || req.user?.sub || req.user?.id;
    return this.userBackendService.getProfile(userId);
  }

  @Get('health')
  @UseGuards(JwtAuthGuard)
  healthCheck(@Request() req) {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'user_backend',
      user: req.user,
    };
  }
}
