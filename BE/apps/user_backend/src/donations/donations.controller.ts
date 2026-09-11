import {
  Controller,
  Post,
  Get,
  Body,
  Request,
  UseGuards,
  HttpStatus,
  HttpException,
  SetMetadata,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../../../libs/auth/jwt-auth.guard';
import { DonationsService } from './donations.service';
import { CreateDonationDto, DonationResponseDto } from './dto/donation.dto';

export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

@Controller('donations')
@UseGuards(JwtAuthGuard)
export class DonationsController {
  constructor(private readonly donationsService: DonationsService) {}

  /**
   * POST /donations/create
   * Create a new donation with fake payment processing
   */
  @Post('create')
  async createDonation(
    @Request() req,
    @Body() createDonationDto: CreateDonationDto,
  ): Promise<DonationResponseDto> {
    const userId = req.user?.userId || req.user?.sub || req.user?.id;

    if (!userId) {
      throw new HttpException('User ID not found in token', HttpStatus.UNAUTHORIZED);
    }

    return this.donationsService.createDonation(userId, createDonationDto);
  }

  /**
   * GET /donations/my-donations
   * Get user's donation history
   */
  @Get('my-donations')
  async getMyDonations(@Request() req) {
    const userId = req.user?.userId || req.user?.sub || req.user?.id;

    if (!userId) {
      throw new HttpException('User ID not found in token', HttpStatus.UNAUTHORIZED);
    }

    return this.donationsService.getMyDonations(userId);
  }

  /**
   * GET /donations/recipients
   * Get list of organizations that can receive donations
   * Public endpoint - no authentication required
   */
  @Public()
  @Get('recipients')
  async getRecipientOrgs() {
    return this.donationsService.getRecipientOrgs();
  }

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

    return this.donationsService.getReceivedDonations(userId);
  }
}
