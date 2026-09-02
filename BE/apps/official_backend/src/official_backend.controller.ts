import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { OfficialBackendService } from './official_backend.service';
import { JwtAuthGuard } from '../../../libs/auth/jwt-auth.guard';

@Controller()
export class OfficialBackendController {
  constructor(
    private readonly officialBackendService: OfficialBackendService,
  ) {}

  @Get()
  getHello(): string {
    return this.officialBackendService.getHello();
  }

  @Get('health')
  @UseGuards(JwtAuthGuard)
  healthCheck(@Request() req) {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'official_backend',
      user: req.user,
    };
  }
}
