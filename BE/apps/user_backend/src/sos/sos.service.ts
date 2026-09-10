import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { PrismaService } from '../../../../libs/prisma/src/prisma.service';
import { CreateSOSDto, UpdateSOSDetailsDto } from './dto/sos.dto';

@Injectable()
export class SosService {
  constructor(private prisma: PrismaService) {}

  private async resolveOperationalUserId(authUserId: string): Promise<string> {
    const allUser = await this.prisma.allUsers.findUnique({
      where: { id: authUserId },
      include: { user: true },
    });

    return allUser?.user?.id || authUserId;
  }

  /**
   * Create SOS report - Immediate emergency alert
   * Saves to disaster_reports table with is_sos flag
   */
  async createSOS(userId: string, dto: CreateSOSDto) {
    try {
      // Get user information
      const allUser = await this.prisma.allUsers.findUnique({
        where: { id: userId },
        include: { user: true },
      });

      if (!allUser || !allUser.user) {
        throw new HttpException('User not found', HttpStatus.NOT_FOUND);
      }

      const user = allUser.user;

      // Create SOS report in disaster_reports table
      const sosReport = await this.prisma.disasterReport.create({
        data: {
          user_id: user.id,
          is_sos: true,
          latitude: dto.latitude,
          longitude: dto.longitude,
          severity: 'SEVERE', // SOS is always severe
          stuck_people_found: true, // SOS implies person needs help
          status: 'pending',
          notes: 'Emergency SOS Alert - Immediate assistance required',
          city: user.city || null,
          pincode: user.pincode || null,
        },
      });

      // Log SOS creation
      console.log(`🚨 SOS ALERT - User: ${user.full_name} (${user.id})`);
      console.log(`   Location: ${dto.latitude}, ${dto.longitude}`);
      console.log(`   Time: ${new Date().toISOString()}`);

      return {
        success: true,
        id: sosReport.id,
        sos_id: sosReport.id,
        message: 'SOS sent successfully. Help is on the way!',
        timestamp: sosReport.createdAt.toISOString(),
        location: {
          latitude: sosReport.latitude || dto.latitude,
          longitude: sosReport.longitude || dto.longitude,
          accuracy: dto.accuracy,
        },
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      console.error('Error creating SOS:', error);
      throw new HttpException(
        'Failed to send SOS alert',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Update SOS report with additional details
   */
  async updateSOSDetails(sosId: string, userId: string, dto: UpdateSOSDetailsDto) {
    try {
      const operationalUserId = await this.resolveOperationalUserId(userId);

      // Verify SOS report exists and belongs to user
      const sosReport = await this.prisma.disasterReport.findFirst({
        where: {
          id: sosId,
          user_id: operationalUserId,
          is_sos: true,
        },
      });

      if (!sosReport) {
        throw new HttpException(
          'SOS report not found or unauthorized',
          HttpStatus.NOT_FOUND,
        );
      }

      // Update with additional details
      const updated = await this.prisma.disasterReport.update({
        where: { id: sosId },
        data: {
          notes: dto.optionalDetails,
          updatedAt: new Date(),
        },
      });

      return {
        success: true,
        message: 'SOS details updated successfully',
        sos_id: updated.id,
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      console.error('Error updating SOS details:', error);
      throw new HttpException(
        'Failed to update SOS details',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Get user's SOS reports
   */
  async getUserSOSReports(userId: string) {
    try {
      const operationalUserId = await this.resolveOperationalUserId(userId);

      const sosReports = await this.prisma.disasterReport.findMany({
        where: {
          user_id: operationalUserId,
          is_sos: true,
        },
        orderBy: { createdAt: 'desc' },
      });

      return {
        success: true,
        reports: sosReports.map((report) => ({
          id: report.id,
          user_id: report.user_id,
          user_name: 'You',
          latitude: report.latitude,
          longitude: report.longitude,
          accuracy: null,
          city: report.city,
          pincode: report.pincode,
          location_timestamp: report.createdAt,
          severity: report.severity,
          status: report.status,
          notes: report.notes,
          created_at: report.createdAt,
          updated_at: report.updatedAt,
          resolved_at: report.resolved_at,
        })),
        total: sosReports.length,
      };
    } catch (error) {
      console.error('Error fetching SOS reports:', error);
      throw new HttpException(
        'Failed to fetch SOS reports',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Get all active SOS reports (for responders/admins)
   */
  async getAllActiveSOSReports() {
    try {
      const sosReports = await this.prisma.disasterReport.findMany({
        where: {
          is_sos: true,
          status: {
            in: ['pending', 'approved', 'team_assigned', 'in_progress'],
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      // Fetch user details for each SOS report
      const reportsWithUserInfo = await Promise.all(
        sosReports.map(async (report) => {
          if (!report.user_id) {
            return null;
          }

          const user = await this.prisma.user.findUnique({
            where: { id: report.user_id },
          });

          return {
            id: report.id,
            user_id: report.user_id,
            // User Information
            user_name: user?.full_name || 'Unknown User',
            phone_number: user?.phone_number || null,
            alternate_phone: user?.alternate_phone || null,
            email: user?.email || null,
            gender: user?.gender || null,
            age: user?.dob ? this.calculateAge(user.dob.toISOString()) : null,
            blood_group: user?.blood_group || null,
            medical_conditions: user?.medical_conditions || null,
            emergency_contact_name: user?.emergency_contact_name || null,
            emergency_contact_phone: user?.emergency_contact_phone || null,
            emergency_contact_relation: user?.emergency_contact_relation || null,
            // Address Information
            current_address: user?.current_address || null,
            city: report.city || user?.city || null,
            pincode: report.pincode || user?.pincode || null,
            state: user?.state || null,
            // Location
            latitude: report.latitude || 0,
            longitude: report.longitude || 0,
            accuracy: 50,
            location_timestamp: report.createdAt.toISOString(),
            // SOS Details
            notes: report.notes,
            severity: report.severity,
            status: report.status,
            created_at: report.createdAt.toISOString(),
            updated_at: report.updatedAt.toISOString(),
          };
        }),
      );

      const validReports = reportsWithUserInfo.filter((r) => r !== null);
      
      return {
        success: true,
        reports: validReports,
        total: validReports.length,
      };
    } catch (error) {
      console.error('Error fetching active SOS reports:', error);
      throw new HttpException(
        'Failed to fetch active SOS reports',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  private calculateAge(dob: string): number {
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  }
}
