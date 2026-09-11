import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { PrismaService } from '../../../../libs/prisma/src/prisma.service';
import { CreateDonationDto } from './dto/donation.dto';
import { randomBytes } from 'crypto';

@Injectable()
export class DonationsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Fake payment handler - Mock payment processor
   * Always returns SUCCESS with a random transaction ID
   */
  private async processFakePayment(amount: number, currency: string = 'INR') {
    // Simulate payment processing delay
    await new Promise(resolve => setTimeout(resolve, 500));

    // Generate random transaction ID
    const transactionId = `TXN_${Date.now()}_${randomBytes(8).toString('hex').toUpperCase()}`;

    return {
      success: true,
      transactionId,
      status: 'success',
      gatewayResponse: {
        gateway: 'dummy',
        message: 'Payment processed successfully',
        timestamp: new Date().toISOString(),
      },
    };
  }

  /**
   * Create a new donation
   */
  async createDonation(userId: string, dto: CreateDonationDto) {
    try {
      // Get donor information
      const allUser = await this.prisma.allUsers.findUnique({
        where: { id: userId },
        include: { user: true, ngo: true, government: true, volunteer: true },
      });

      if (!allUser) {
        throw new HttpException('User not found', HttpStatus.NOT_FOUND);
      }

      // Determine donor name
      let donorName = allUser.full_name;
      let donorEmail = allUser.email;

      if (allUser.user) {
        donorName = allUser.user.full_name;
        donorEmail = allUser.user.email;
      } else if (allUser.ngo) {
        donorName = allUser.ngo.ngo_name;
        donorEmail = allUser.ngo.email;
      } else if (allUser.government) {
        donorName = allUser.government.agency_name;
        donorEmail = allUser.government.email;
      } else if (allUser.volunteer) {
        donorName = allUser.volunteer.group_name;
        donorEmail = allUser.volunteer.email;
      }

      // Get recipient information
      let recipientName = 'RICOS';
      let recipientId: string | null = null;

      if (dto.recipient_type !== 'ricos') {
        if (!dto.recipient_id) {
          throw new HttpException(
            'recipient_id is required when not donating to RICOS',
            HttpStatus.BAD_REQUEST,
          );
        }

        recipientId = dto.recipient_id;

        // Fetch recipient details
        if (dto.recipient_type === 'ngo') {
          const ngo = await this.prisma.nGO.findUnique({
            where: { id: dto.recipient_id },
          });
          if (!ngo) {
            throw new HttpException('NGO not found', HttpStatus.NOT_FOUND);
          }
          recipientName = ngo.ngo_name;
        } else if (dto.recipient_type === 'govt') {
          const govt = await this.prisma.government.findUnique({
            where: { id: dto.recipient_id },
          });
          if (!govt) {
            throw new HttpException('Government agency not found', HttpStatus.NOT_FOUND);
          }
          recipientName = govt.agency_name;
        } else if (dto.recipient_type === 'volunteer') {
          const volunteer = await this.prisma.volunteer.findUnique({
            where: { id: dto.recipient_id },
          });
          if (!volunteer) {
            throw new HttpException('Volunteer group not found', HttpStatus.NOT_FOUND);
          }
          recipientName = volunteer.group_name;
        }
      }

      // Process fake payment
      const paymentResult = await this.processFakePayment(dto.amount, 'INR');

      if (!paymentResult.success) {
        throw new HttpException('Payment processing failed', HttpStatus.PAYMENT_REQUIRED);
      }

      // Create donation record
      const donation = await this.prisma.donation.create({
        data: {
          donor_user_id: dto.is_anonymous ? null : userId,
          donor_name: dto.is_anonymous ? 'Anonymous' : donorName,
          donor_email: dto.is_anonymous ? null : donorEmail,
          recipient_type: dto.recipient_type,
          recipient_id: recipientId,
          recipient_name: recipientName,
          amount: dto.amount,
          currency: 'INR',
          payment_method: dto.payment_method || 'card',
          transaction_id: paymentResult.transactionId,
          payment_status: 'success',
          is_anonymous: dto.is_anonymous || false,
          message: dto.message,
        },
      });

      // Create transaction record
      await this.prisma.transaction.create({
        data: {
          donation_id: donation.id,
          gateway: 'dummy',
          gateway_tx_id: paymentResult.transactionId,
          amount: dto.amount,
          currency: 'INR',
          status: 'success',
          payment_details: paymentResult.gatewayResponse,
          completed_at: new Date(),
        },
      });

      return {
        success: true,
        donation_id: donation.id,
        transaction_id: paymentResult.transactionId,
        amount: dto.amount,
        currency: 'INR',
        payment_status: 'success',
        message: `Thank you for your donation of ₹${dto.amount} to ${recipientName}!`,
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      console.error('Error creating donation:', error);
      throw new HttpException(
        'Failed to process donation',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Get user's donation history
   */
  async getMyDonations(userId: string) {
    try {
      const donations = await this.prisma.donation.findMany({
        where: { donor_user_id: userId },
        orderBy: { createdAt: 'desc' },
      });

      const total = donations.length;
      const totalAmount = donations.reduce((sum, d) => sum + d.amount, 0);

      return {
        success: true,
        donations: donations.map(d => ({
          id: d.id,
          recipient_type: d.recipient_type,
          recipient_name: d.recipient_name,
          amount: d.amount,
          currency: d.currency,
          payment_status: d.payment_status,
          transaction_id: d.transaction_id,
          message: d.message,
          created_at: d.createdAt,
        })),
        total,
        totalAmount,
      };
    } catch (error) {
      console.error('Error fetching donations:', error);
      throw new HttpException(
        'Failed to fetch donations',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Get list of recipient organizations (NGO, Govt, Volunteer)
   */
  async getRecipientOrgs() {
    try {
      const [ngos, govts, volunteers] = await Promise.all([
        this.prisma.nGO.findMany({
          include: {
            groups: {
              where: { is_active: true },
            },
          },
        }),
        this.prisma.government.findMany({
          include: {
            groups: {
              where: { is_active: true },
            },
          },
        }),
        this.prisma.volunteer.findMany({
          include: {
            groups: {
              where: { is_active: true },
            },
          },
        }),
      ]);

      const organizations = [
        ...ngos.map(ngo => ({
          id: ngo.id,
          name: ngo.ngo_name,
          type: 'ngo',
          description: ngo.mission_statement || `${ngo.ngo_type} - Established ${ngo.year_established}`,
          activeGroups: ngo.groups.length,
        })),
        ...govts.map(govt => ({
          id: govt.id,
          name: govt.agency_name,
          type: 'govt',
          description: `${govt.department} - ${govt.govt_level}`,
          activeGroups: govt.groups.length,
        })),
        ...volunteers.map(vol => ({
          id: vol.id,
          name: vol.group_name,
          type: 'volunteer',
          description: `${vol.volunteer_type} - Team of ${vol.group_size}`,
          activeGroups: vol.groups.length,
        })),
      ];

      return {
        success: true,
        organizations,
        total: organizations.length,
      };
    } catch (error) {
      console.error('Error fetching recipients:', error);
      throw new HttpException(
        'Failed to fetch recipient organizations',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

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
      const uniqueDonors = new Set(donations.map(d => d.donor_user_id || 'anonymous')).size;

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
}
