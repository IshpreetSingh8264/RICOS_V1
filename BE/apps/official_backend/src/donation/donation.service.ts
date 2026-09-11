import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { PrismaService } from '../../../../libs/prisma/src/prisma.service';

@Injectable()
export class DonationService {
  constructor(private prisma: PrismaService) {}

  /**
   * Get donations received by an organization (for NGO/Govt/Volunteer dashboard)
   */
  async getReceivedDonations(userId: string) {
    try {
      // Get user's organization
      const allUser = await this.prisma.allUsers.findUnique({
        where: { id: userId },
      });

      if (!allUser) {
        throw new HttpException('User not found', HttpStatus.NOT_FOUND);
      }

      let recipientId: string | null = null;
      let recipientType: string | null = null;

      if (allUser.ngo_id) {
        recipientId = allUser.ngo_id;
        recipientType = 'ngo';
      } else if (allUser.govt_id) {
        recipientId = allUser.govt_id;
        recipientType = 'govt';
      } else if (allUser.volunteer_id) {
        recipientId = allUser.volunteer_id;
        recipientType = 'volunteer';
      } else {
        throw new HttpException(
          'Only NGO, Government, and Volunteer organizations can view received donations',
          HttpStatus.FORBIDDEN,
        );
      }

      // Get donations received by this organization
      const donations = await this.prisma.donation.findMany({
        where: {
          recipient_type: recipientType,
          recipient_id: recipientId,
          payment_status: 'success',
        },
        orderBy: { createdAt: 'desc' },
      });

      const total = donations.length;
      const totalAmount = donations.reduce((sum, d) => sum + d.amount, 0);
      const uniqueDonors = new Set(
        donations.map(d => d.donor_user_id || 'anonymous'),
      ).size;

      return {
        success: true,
        donations: donations.map(d => ({
          id: d.id,
          donor_name: d.donor_name,
          amount: d.amount,
          currency: d.currency,
          payment_status: d.payment_status,
          message: d.message,
          is_anonymous: d.is_anonymous,
          created_at: d.createdAt,
        })),
        stats: {
          total,
          totalAmount,
          uniqueDonors,
        },
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      console.error('Error fetching received donations:', error);
      throw new HttpException(
        'Failed to fetch received donations',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Get donation statistics for organization dashboard
   */
  async getDonationStats(userId: string) {
    try {
      const result = await this.getReceivedDonations(userId);
      
      if (!result.success) {
        throw new HttpException('Failed to fetch donation stats', HttpStatus.INTERNAL_SERVER_ERROR);
      }

      // Calculate monthly breakdown
      const now = new Date();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();

      const thisMonthDonations = result.donations.filter(d => {
        const donationDate = new Date(d.created_at);
        return donationDate.getMonth() === currentMonth && 
               donationDate.getFullYear() === currentYear;
      });

      const thisMonthTotal = thisMonthDonations.reduce((sum, d) => sum + d.amount, 0);

      return {
        success: true,
        stats: {
          ...result.stats,
          thisMonthTotal,
          thisMonthCount: thisMonthDonations.length,
          averageDonation: result.stats.total > 0 
            ? Math.round(result.stats.totalAmount / result.stats.total) 
            : 0,
        },
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      console.error('Error fetching donation stats:', error);
      throw new HttpException(
        'Failed to fetch donation statistics',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
