import {
  Controller,
  Post,
  Patch,
  Get,
  Body,
  Param,
  Request,
  UseGuards,
  HttpStatus,
  HttpException,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../../../libs/auth/jwt-auth.guard';
import { SosService } from './sos.service';
import { CreateSOSDto, UpdateSOSDetailsDto, SOSResponseDto } from './dto/sos.dto';

@Controller('sos')
@UseGuards(JwtAuthGuard)
export class SosController {
  constructor(private readonly sosService: SosService) {}

  /**
   * POST /sos
   * Create immediate SOS report
   */
  @Post()
  async createSOS(
    @Request() req,
    @Body() createSOSDto: CreateSOSDto,
  ): Promise<SOSResponseDto> {
    const userId = req.user?.userId || req.user?.sub || req.user?.id;

    if (!userId) {
      throw new HttpException('User ID not found in token', HttpStatus.UNAUTHORIZED);
    }

    return this.sosService.createSOS(userId, createSOSDto);
  }

  /**
   * PATCH /sos/:id/details
   * Add additional details to existing SOS report
   */
  @Patch(':id/details')
  async updateSOSDetails(
    @Request() req,
    @Param('id') sosId: string,
    @Body() updateSOSDetailsDto: UpdateSOSDetailsDto,
  ) {
    const userId = req.user?.userId || req.user?.sub || req.user?.id;

    if (!userId) {
      throw new HttpException('User ID not found in token', HttpStatus.UNAUTHORIZED);
    }

    return this.sosService.updateSOSDetails(sosId, userId, updateSOSDetailsDto);
  }

  /**
   * GET /sos/my-reports
   * Get user's SOS reports
   */
  @Get('my-reports')
  async getUserSOSReports(@Request() req) {
    const userId = req.user?.userId || req.user?.sub || req.user?.id;

    if (!userId) {
      throw new HttpException('User ID not found in token', HttpStatus.UNAUTHORIZED);
    }

    return this.sosService.getUserSOSReports(userId);
  }

  /**
   * GET /sos/active
   * Get all active SOS reports (for responders)
   */
  @Get('active')
  async getAllActiveSOSReports() {
    return this.sosService.getAllActiveSOSReports();
  }
}
