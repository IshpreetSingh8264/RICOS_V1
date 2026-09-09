import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../../../libs/prisma/src/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get the actual entity ID (ngo_id, govt_id, or volunteer_id) from AllUsers table
   */
  private async getActualEntityId(
    userId: string,
    userType: string,
  ): Promise<string> {
    const allUser = await this.prisma.allUsers.findUnique({
      where: { id: userId },
    });

    if (!allUser) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    if (userType === 'ngo') {
      if (!allUser.ngo_id) {
        throw new NotFoundException(
          `NGO ID not found for user ${userId}`,
        );
      }
      return allUser.ngo_id;
    } else if (userType === 'govt') {
      if (!allUser.govt_id) {
        throw new NotFoundException(
          `Government ID not found for user ${userId}`,
        );
      }
      return allUser.govt_id;
    } else if (userType === 'volunteer') {
      if (!allUser.volunteer_id) {
        throw new NotFoundException(
          `Volunteer ID not found for user ${userId}`,
        );
      }
      return allUser.volunteer_id;
    }

    throw new ForbiddenException('Invalid user type for dashboard access');
  }

  /**
   * Get dashboard statistics for NGO/Govt/Volunteer
   */
  async getDashboardStats(userId: string, userType: string) {
    if (userType !== 'ngo' && userType !== 'govt' && userType !== 'volunteer') {
      throw new ForbiddenException(
        'Only NGOs, Government, and Volunteers can access dashboard',
      );
    }

    const actualEntityId = await this.getActualEntityId(userId, userType);

    // Get active groups (missions) count
    const whereClause: any = {
      creator_id: actualEntityId,
      is_active: true,
    };

    if (userType === 'ngo') {
      whereClause.ngo_id = actualEntityId;
    } else if (userType === 'govt') {
      whereClause.govt_id = actualEntityId;
    } else if (userType === 'volunteer') {
      whereClause.volunteer_id = actualEntityId;
    }

    const activeGroups = await this.prisma.group.count({
      where: whereClause,
    });

    // Get total inventory items
    const inventoryWhere: any = {};
    if (userType === 'ngo') {
      inventoryWhere.ngo_id = actualEntityId;
    } else if (userType === 'volunteer') {
      inventoryWhere.volunteer_id = actualEntityId;
    }

    const totalInventoryItems = await this.prisma.inventoryItem.count({
      where: inventoryWhere,
    });

    // Get active incidents count (all disaster reports)
    const activeIncidents = await this.prisma.disasterReport.count({
      where: {},
    });

    // Calculate people helped (this is a placeholder - you might want to track this differently)
    // For now, we'll use the sum of affected_population from all submitted reports
    const incidents = await this.prisma.disasterReport.findMany({
      where: {},
      select: {
        affected_population: true,
      },
    });

    const peopleHelped = incidents.reduce(
      (sum, incident) => sum + (incident.affected_population || 0),
      0,
    );

    // Get total resources allocated to groups
    const allocations = await this.prisma.groupResourceAllocation.findMany({
      where: {
        group: whereClause,
      },
      select: {
        allocated_quantity: true,
      },
    });

    const resourcesAllocated = allocations.reduce(
      (sum, alloc) => sum + alloc.allocated_quantity,
      0,
    );

    return {
      activeIncidents,
      peopleHelped,
      activeMissions: activeGroups,
      totalInventoryItems,
      resourcesAllocated,
      responseRate: activeGroups > 0 ? 100 : 0, // Placeholder
    };
  }

  /**
   * Get disaster incidents/reports submitted by users with search and pagination
   */
  async getIncidents(
    userId: string,
    userType: string,
    page: number = 1,
    limit: number = 20,
    search?: string,
    severity?: string,
  ) {
    if (userType !== 'ngo' && userType !== 'govt' && userType !== 'volunteer') {
      throw new ForbiddenException(
        'Only NGOs, Government, and Volunteers can view incidents',
      );
    }

    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};

    // Add severity filter
    if (severity && ['LOW', 'MODERATE', 'SEVERE'].includes(severity)) {
      where.severity = severity;
    }

    // Add search filter (search in city, village, pincode, notes)
    if (search) {
      where.OR = [
        { city: { contains: search, mode: 'insensitive' } },
        { village: { contains: search, mode: 'insensitive' } },
        { pincode: { contains: search, mode: 'insensitive' } },
        { notes: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Get total count for pagination
    const total = await this.prisma.disasterReport.count({ where });

    // Get paginated incidents
    const incidents = await this.prisma.disasterReport.findMany({
      where,
      skip,
      take: limit,
      orderBy: {
        createdAt: 'desc',
      },
      select: {
        id: true,
        responder_id: true,
        pincode: true,
        city: true,
        village: true,
        latitude: true,
        longitude: true,
        severity: true,
        water_level: true,
        affected_population: true,
        stuck_people_found: true,
        resources_needed: true,
        notes: true,
        images: true,
        status: true,
        approved_at: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      incidents: incidents.map((incident) => ({
        ...incident,
        resources_needed: incident.resources_needed
          ? incident.resources_needed.split(',').map((r) => r.trim())
          : [],
        images: incident.images ? JSON.parse(incident.images) : [],
      })),
    };
  }
}
