import {
  Controller,
  Get,
  Request,
  UseGuards,
  HttpStatus,
  HttpException,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../../../libs/auth/jwt-auth.guard';
import { DonationService } from './donation.service';

@Controller('donations')
@UseGuards(JwtAuthGuard)
export class DonationController {
  constructor(private readonly donationService: DonationService) {}

  /**
   * GET /donations/received
   * Get donations received by the organization (for NGO/Govt/Volunteer dashboard)
   */
  @Get('received')
  async getReceivedDonations(@Request() req) {
    const userId = req.user?.userId || req.user?.sub || req.user?.id;

    if (!userId) {
      throw new HttpException('User ID not found in token', HttpStatus.UNAUTHORIZED);
    }

    return this.donationService.getReceivedDonations(userId);
  }

  /**
   * GET /donations/stats
   * Get donation statistics for organization dashboard
   */
  @Get('stats')
  async getDonationStats(@Request() req) {
    const userId = req.user?.userId || req.user?.sub || req.user?.id;

    if (!userId) {
      throw new HttpException('User ID not found in token', HttpStatus.UNAUTHORIZED);
    }

    return this.donationService.getDonationStats(userId);
  }
}
