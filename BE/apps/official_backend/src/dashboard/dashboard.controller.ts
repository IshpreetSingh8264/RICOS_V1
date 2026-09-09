import { Controller, Get, UseGuards, Request, Query } from '@nestjs/common';
import { JwtAuthGuard } from '../../../../libs/auth/jwt-auth.guard';
import { DashboardService } from './dashboard.service';

@Controller('dashboard')
@UseGuards(JwtAuthGuard)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('stats')
  async getDashboardStats(@Request() req) {
    const userId = req.user.userId || req.user.sub;
    const userType = req.user.userType || req.user.role;
    return this.dashboardService.getDashboardStats(userId, userType);
  }

  @Get('incidents')
  async getIncidents(
    @Request() req,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('severity') severity?: string,
  ) {
    const userId = req.user.userId || req.user.sub;
    const userType = req.user.userType || req.user.role;
    
    const pageNum = parseInt(page || '1', 10);
    const limitNum = parseInt(limit || '20', 10);
    
    return this.dashboardService.getIncidents(
      userId,
      userType,
      pageNum,
      limitNum,
      search,
      severity,
    );
  }
}
