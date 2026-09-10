import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  Param,
  UseGuards,
  Request,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { MapService } from './map.service';
import { JwtAuthGuard } from '../../../../libs/auth/jwt-auth.guard';
import {
  UpdateLocationDto,
  SubmitDisasterReportDto,
  ApproveReportDto,
} from './map.dto';

@Controller('map')
@UseGuards(JwtAuthGuard)
export class MapController {
  constructor(private readonly mapService: MapService) {}

  @Post('location')
  async updateLocation(@Request() req, @Body() dto: UpdateLocationDto) {
    const userId = req.user?.userId || req.user?.sub || req.user?.id;
    
    // Get responder ID from user
    const allUser = await this.mapService['prisma'].allUsers.findUnique({
      where: { id: userId },
      include: { user: true, ngo: true, government: true, volunteer: true },
    });

    let responderId: string | undefined = undefined;
    
    if (!allUser) {
      throw new Error('User not found');
    }
    
    if (allUser.ngo) {
      let responder = await this.mapService['prisma'].responder.findUnique({
        where: { ngo_id: allUser.ngo.id },
      });
      if (!responder) {
        responder = await this.mapService['prisma'].responder.create({
          data: {
            ngo_id: allUser.ngo.id,
            services_provided: 'Disaster Relief',
            bank_account_number: allUser.ngo.bank_account_number,
            isActive: true,
          },
        });
      }
      responderId = responder?.id;
    } else if (allUser.government) {
      let responder = await this.mapService['prisma'].responder.findUnique({
        where: { govt_id: allUser.government.id },
      });
      if (!responder) {
        responder = await this.mapService['prisma'].responder.create({
          data: {
            govt_id: allUser.government.id,
            services_provided: 'Government Relief',
            bank_account_number: allUser.government.bank_account_number,
            isActive: true,
          },
        });
      }
      responderId = responder?.id;
    } else if (allUser.volunteer) {
      let responder = await this.mapService['prisma'].responder.findUnique({
        where: { volunteer_id: allUser.volunteer.id },
      });
      if (!responder) {
        responder = await this.mapService['prisma'].responder.create({
          data: {
            volunteer_id: allUser.volunteer.id,
            services_provided: 'Volunteer Relief',
            bank_account_number: '0000000000',
            isActive: true,
          },
        });
      }
      responderId = responder?.id;
    } else {
      // Regular user - not allowed to be responder
      throw new Error(`Only NGO, Government, or Volunteer users can be responders. Your user type is: ${allUser.user_type}`);
    }

    if (!responderId) {
      throw new Error('Failed to get or create responder');
    }

    return this.mapService.updateResponderLocation(responderId, dto);
  }

  @Post('report')
  async submitReport(@Request() req, @Body() dto: SubmitDisasterReportDto) {
    // Extract user ID from JWT token (JWT strategy returns userId field)
    const userId = req.user?.userId || req.user?.sub || req.user?.id;
    
    if (!userId) {
      console.error('JWT user object:', req.user);
      throw new Error('User ID not found in token');
    }

    console.log('Looking up user with ID:', userId);
    
    // Get responder ID from user
    const allUser = await this.mapService['prisma'].allUsers.findUnique({
      where: { id: userId },
      include: { user: true, ngo: true, government: true, volunteer: true },
    });

    let responderId: string | undefined = undefined;
    
    if (!allUser) {
      console.error('User not found in database with ID:', userId);
      throw new HttpException(
        'Your session is invalid. Please log out and log back in.',
        HttpStatus.UNAUTHORIZED,
      );
    }

    console.log('Found user:', allUser.email, 'Type:', allUser.user_type);
    
    if (allUser.ngo) {
      let responder = await this.mapService['prisma'].responder.findUnique({
        where: { ngo_id: allUser.ngo.id },
      });
      if (!responder) {
        responder = await this.mapService['prisma'].responder.create({
          data: {
            ngo_id: allUser.ngo.id,
            services_provided: 'Disaster Relief',
            bank_account_number: allUser.ngo.bank_account_number,
            isActive: true,
          },
        });
      }
      responderId = responder?.id;
    } else if (allUser.government) {
      let responder = await this.mapService['prisma'].responder.findUnique({
        where: { govt_id: allUser.government.id },
      });
      if (!responder) {
        responder = await this.mapService['prisma'].responder.create({
          data: {
            govt_id: allUser.government.id,
            services_provided: 'Government Relief',
            bank_account_number: allUser.government.bank_account_number,
            isActive: true,
          },
        });
      }
      responderId = responder?.id;
    } else if (allUser.volunteer) {
      let responder = await this.mapService['prisma'].responder.findUnique({
        where: { volunteer_id: allUser.volunteer.id },
      });
      if (!responder) {
        responder = await this.mapService['prisma'].responder.create({
          data: {
            volunteer_id: allUser.volunteer.id,
            services_provided: 'Volunteer Relief',
            bank_account_number: '0000000000',
            isActive: true,
          },
        });
      }
      responderId = responder?.id;
    } else {
      throw new Error(`Only NGO, Government, or Volunteer users can submit disaster reports. Your user type is: ${allUser.user_type}`);
    }

    if (!responderId) {
      throw new Error('Failed to get or create responder');
    }

    return this.mapService.submitDisasterReport(responderId, dto);
  }

  @Get('live')
  async getLiveData() {
    return this.mapService.getLiveMapData();
  }

  @Get('reports/pending')
  async getPendingReports() {
    return this.mapService.getPendingReports();
  }

  @Patch('reports/:id/approve')
  async approveReport(
    @Param('id') reportId: string,
    @Request() req,
    @Body() dto: ApproveReportDto,
  ) {
    const userId = req.user?.userId || req.user?.sub || req.user?.id;
    return this.mapService.approveOrRejectReport(reportId, userId, dto);
  }

  @Post('user/sos')
  async submitUserSOS(@Request() req, @Body() body: { latitude?: number; longitude?: number; notes?: string }) {
    const userId = req.user?.userId || req.user?.sub || req.user?.id;
    
    // Get user details
    const allUser = await this.mapService['prisma'].allUsers.findUnique({
      where: { id: userId },
      include: { user: true },
    });

    if (!allUser || !allUser.user) {
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    }

    return this.mapService.submitUserSOS(allUser.user.id, body);
  }

  @Post('user/report')
  async submitUserReport(@Request() req, @Body() dto: any) {
    const userId = req.user?.userId || req.user?.sub || req.user?.id;
    
    // Get user details
    const allUser = await this.mapService['prisma'].allUsers.findUnique({
      where: { id: userId },
      include: { user: true },
    });

    if (!allUser || !allUser.user) {
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    }

    return this.mapService.submitUserIncidentReport(allUser.user.id, dto);
  }

  @Get('user/reports')
  async getUserReports(@Request() req) {
    const userId = req.user?.userId || req.user?.sub || req.user?.id;
    
    // Get user details
    const allUser = await this.mapService['prisma'].allUsers.findUnique({
      where: { id: userId },
      include: { user: true },
    });

    if (!allUser || !allUser.user) {
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    }

    return this.mapService.getUserReports(allUser.user.id);
  }

  @Get('incidents/all')
  async getAllIncidents(@Request() req) {
    // Public-facing incidents view for all users
    return this.mapService.getAllIncidentsWithGroups();
  }
}
