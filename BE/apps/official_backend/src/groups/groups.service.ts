import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../../../libs/prisma/src/prisma.service';
import { CreateGroupDto, TTLType } from './dto/create-group.dto';
import { UpdateGroupDto } from './dto/update-group.dto';
import { GroupSignInDto } from './dto/group-signin.dto';
import { UpdateGroupLocationDto } from './dto/group-location.dto';
import { AssignGroupDto, UpdateAssignmentStatusDto, UpdateOperationStatusDto, CompleteAssignmentDto } from './dto/group-assignment.dto';
import * as bcrypt from 'bcrypt';

// Haversine formula to calculate distance in km between two lat/lng points
function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

@Injectable()
export class GroupsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  /**
   * Helper: resolve allUsers.id → actual entity ID (ngo_id / govt_id / volunteer_id)
   */
  private async getActualEntityId(userId: string, role: string): Promise<string> {
    const allUser = await this.prisma.allUsers.findUnique({ where: { id: userId } });
    if (!allUser) throw new NotFoundException(`User ${userId} not found.`);

    if (role === 'ngo') {
      if (!allUser.ngo_id) throw new NotFoundException(`NGO ID not found for user ${userId}.`);
      return allUser.ngo_id;
    } else if (role === 'govt') {
      if (!allUser.govt_id) throw new NotFoundException(`Government ID not found for user ${userId}.`);
      return allUser.govt_id;
    } else if (role === 'volunteer') {
      if (!allUser.volunteer_id) throw new NotFoundException(`Volunteer ID not found for user ${userId}.`);
      return allUser.volunteer_id;
    }
    throw new ForbiddenException('Invalid role for group management');
  }

  private calculateExpiryDate(ttlType: TTLType): Date | null {
    const now = new Date();
    switch (ttlType) {
      case TTLType.FIVE_DAYS:
        return new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000);
      case TTLType.TWENTY_DAYS:
        return new Date(now.getTime() + 20 * 24 * 60 * 60 * 1000);
      case TTLType.THIRTY_DAYS:
        return new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
      case TTLType.NO_EXPIRY:
        return null;
      default:
        return null;
    }
  }

  private async getOrganizationName(role: string, actualEntityId: string): Promise<string> {
    if (role === 'ngo') {
      const ngo = await this.prisma.nGO.findUnique({ where: { id: actualEntityId } });
      return ngo?.ngo_name || 'NGO';
    } else if (role === 'govt') {
      const govt = await this.prisma.government.findUnique({ where: { id: actualEntityId } });
      return govt?.agency_name || 'GOVT';
    } else if (role === 'volunteer') {
      const volunteer = await this.prisma.volunteer.findUnique({ where: { id: actualEntityId } });
      return volunteer?.group_name || 'VOLUNTEER';
    }
    return 'ORG';
  }

  // ===================== CRUD =====================

  async create(createDto: CreateGroupDto, userId: string, role: string) {
    if (role !== 'ngo' && role !== 'govt' && role !== 'volunteer') {
      throw new ForbiddenException('Only NGOs, Government agencies, and Volunteers can create groups');
    }

    const actualEntityId = await this.getActualEntityId(userId, role);
    const orgName = await this.getOrganizationName(role, actualEntityId);
    const cleanOrgName = orgName.replace(/\s+/g, '_').toLowerCase();
    const cleanGroupName = createDto.group_name.replace(/\s+/g, '_').toLowerCase();
    const username = `${cleanOrgName}_${cleanGroupName}`;
    const emailGroupName = createDto.group_name.replace(/\s+/g, '').toLowerCase();
    const emailOrgName = orgName.replace(/\s+/g, '').toLowerCase();
    const generatedEmail = `${emailGroupName}.${emailOrgName}@groups.ricos.com`;

    const existingGroup = await this.prisma.group.findUnique({ where: { username } });
    if (existingGroup) throw new BadRequestException('A group with this name already exists for your organization');

    if (generatedEmail) {
      const existingEmailGroup = await this.prisma.group.findUnique({ where: { email: generatedEmail } });
      if (existingEmailGroup) throw new BadRequestException('A group with this email already exists');
    }

    const hashedPassword = await bcrypt.hash(createDto.password, 10);
    const expiresAt = this.calculateExpiryDate(createDto.ttl_type);

    const groupData: any = {
      group_name: createDto.group_name,
      username,
      email: generatedEmail,
      password: hashedPassword,
      creator_type: role,
      creator_id: actualEntityId,
      ttl_type: createDto.ttl_type,
      expires_at: expiresAt,
    };

    if (role === 'ngo') groupData.ngo_id = actualEntityId;
    else if (role === 'govt') groupData.govt_id = actualEntityId;
    else if (role === 'volunteer') groupData.volunteer_id = actualEntityId;

    const group = await this.prisma.group.create({ data: groupData });

    if (createDto.resource_allocations && createDto.resource_allocations.length > 0) {
      for (const allocation of createDto.resource_allocations) {
        const inventoryItem = await this.prisma.inventoryItem.findUnique({ where: { id: allocation.inventory_item_id } });
        if (!inventoryItem) throw new NotFoundException(`Inventory item ${allocation.inventory_item_id} not found`);

        if (
          (role === 'ngo' && inventoryItem.ngo_id !== actualEntityId) ||
          (role === 'volunteer' && inventoryItem.volunteer_id !== actualEntityId)
        ) {
          throw new ForbiddenException('You can only allocate your own inventory items');
        }

        const existingAllocations = await this.prisma.groupResourceAllocation.findMany({
          where: { inventory_item_id: allocation.inventory_item_id },
        });
        const totalAllocated = existingAllocations.reduce((sum, a) => sum + a.allocated_quantity, 0);
        const availableQuantity = inventoryItem.total_quantity - totalAllocated;

        if (availableQuantity < allocation.allocated_quantity) {
          throw new BadRequestException(
            `Insufficient quantity for item ${inventoryItem.item}. Available: ${availableQuantity}, Requested: ${allocation.allocated_quantity}`,
          );
        }

        await this.prisma.groupResourceAllocation.create({
          data: { group_id: group.id, inventory_item_id: allocation.inventory_item_id, allocated_quantity: allocation.allocated_quantity },
        });
      }
    }

    return this.findOne(group.id, userId, role);
  }

  async findAll(userId: string, role: string) {
    if (role !== 'ngo' && role !== 'govt' && role !== 'volunteer') {
      throw new ForbiddenException('Only NGOs, Government, and Volunteers can view groups');
    }
    const actualEntityId = await this.getActualEntityId(userId, role);
    return this.prisma.group.findMany({
      where: { creator_id: actualEntityId },
      include: {
        resourceAllocations: { include: { inventoryItem: true } },
        location: true,
        assignments: {
          where: { status: 'active' },
          orderBy: { assigned_at: 'desc' },
          take: 1,
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, userId: string, role: string) {
    if (role !== 'ngo' && role !== 'govt' && role !== 'volunteer') {
      throw new ForbiddenException('Only NGOs, Government, and Volunteers can view groups');
    }
    const actualEntityId = await this.getActualEntityId(userId, role);
    const group = await this.prisma.group.findUnique({
      where: { id },
      include: {
        resourceAllocations: { include: { inventoryItem: true } },
        location: true,
        assignments: {
          where: { status: 'active' },
          orderBy: { assigned_at: 'desc' },
          take: 1,
        },
      },
    });
    if (!group) throw new NotFoundException(`Group ${id} not found`);
    if (group.creator_id !== actualEntityId) throw new ForbiddenException('You do not have access to this group');
    return group;
  }

  async update(id: string, updateDto: UpdateGroupDto, userId: string, role: string) {
    const group = await this.findOne(id, userId, role);
    const updateData: any = {};

    if (updateDto.group_name) updateData.group_name = updateDto.group_name;
    if (updateDto.password) updateData.password = await bcrypt.hash(updateDto.password, 10);
    if (updateDto.ttl_type) {
      updateData.ttl_type = updateDto.ttl_type;
      updateData.expires_at = this.calculateExpiryDate(updateDto.ttl_type);
    }
    if (updateDto.is_active !== undefined) updateData.is_active = updateDto.is_active;

    if (updateDto.resource_allocations) {
      await this.prisma.groupResourceAllocation.deleteMany({ where: { group_id: id } });
      for (const allocation of updateDto.resource_allocations) {
        const inventoryItem = await this.prisma.inventoryItem.findUnique({ where: { id: allocation.inventory_item_id } });
        if (!inventoryItem) throw new NotFoundException(`Inventory item ${allocation.inventory_item_id} not found`);

        const existingAllocations = await this.prisma.groupResourceAllocation.findMany({
          where: { inventory_item_id: allocation.inventory_item_id },
        });
        const totalAllocated = existingAllocations.reduce((sum, a) => sum + a.allocated_quantity, 0);
        const availableQuantity = inventoryItem.total_quantity - totalAllocated;

        if (availableQuantity < allocation.allocated_quantity) {
          throw new BadRequestException(
            `Insufficient quantity for item ${inventoryItem.item}. Available: ${availableQuantity}, Requested: ${allocation.allocated_quantity}`,
          );
        }

        await this.prisma.groupResourceAllocation.create({
          data: { group_id: id, inventory_item_id: allocation.inventory_item_id, allocated_quantity: allocation.allocated_quantity },
        });
      }
    }

    await this.prisma.group.update({ where: { id }, data: updateData });
    return this.findOne(id, userId, role);
  }

  async remove(id: string, userId: string, role: string) {
    await this.findOne(id, userId, role);
    return this.prisma.group.delete({ where: { id } });
  }

  async signIn(signInDto: GroupSignInDto) {
    let group = await this.prisma.group.findUnique({ where: { username: signInDto.username } });
    if (!group) group = await this.prisma.group.findUnique({ where: { email: signInDto.username } });
    if (!group) throw new UnauthorizedException('Invalid credentials');
    if (!group.is_active) throw new UnauthorizedException('This group has been deactivated');
    if (group.expires_at && new Date() > group.expires_at) throw new UnauthorizedException('This group has expired');

    const isPasswordValid = await bcrypt.compare(signInDto.password, group.password);
    if (!isPasswordValid) throw new UnauthorizedException('Invalid credentials');

    const payload = {
      sub: group.id,
      username: group.username,
      role: 'group',
      creator_type: group.creator_type,
      creator_id: group.creator_id,
    };

    return {
      access_token: this.jwtService.sign(payload),
      user_type: 'group',
      group_id: group.id,
      group_name: group.group_name,
      username: group.username,
      email: group.email,
      expires_at: group.expires_at,
    };
  }

  // ===================== LOCATION TRACKING =====================

  /**
   * Group pings its own GPS location (called from group-role JWT)
   */
  async updateGroupLocation(groupId: string, dto: UpdateGroupLocationDto) {
    // Verify group exists and is active
    const group = await this.prisma.group.findUnique({ where: { id: groupId } });
    if (!group) throw new NotFoundException(`Group ${groupId} not found`);
    if (!group.is_active) throw new ForbiddenException('This group is inactive');

    // Upsert latest location (one record per group)
    const location = await this.prisma.groupLocation.upsert({
      where: { group_id: groupId },
      create: {
        group_id: groupId,
        latitude: dto.latitude,
        longitude: dto.longitude,
        accuracy: dto.accuracy,
        status: dto.status || 'available',
        battery_level: dto.battery_level,
        timestamp: new Date(),
      },
      update: {
        latitude: dto.latitude,
        longitude: dto.longitude,
        accuracy: dto.accuracy,
        status: dto.status || 'available',
        battery_level: dto.battery_level,
        timestamp: new Date(),
      },
    });

    return { success: true, message: 'Location updated', location };
  }

  /**
   * Get all active group locations (for map view, accessible to NGO/Govt/Volunteer)
   */
  async getAllGroupLocations() {
    const locations = await this.prisma.groupLocation.findMany({
      include: {
        group: {
          include: {
            ngo: { select: { ngo_name: true } },
            government: { select: { agency_name: true } },
            volunteer: { select: { group_name: true } },
            resourceAllocations: { include: { inventoryItem: { select: { item: true } } } },
            assignments: {
              where: { status: 'active' },
              orderBy: { assigned_at: 'desc' },
              take: 1,
            },
          },
        },
      },
    });

    return locations
      .filter((loc) => loc.group.is_active)
      .map((loc) => {
        const g = loc.group;
        const orgName = g.ngo?.ngo_name || g.government?.agency_name || g.volunteer?.group_name || 'Unknown';
        const activeAssignment = g.assignments[0] || null;
        return {
          group_id: g.id,
          group_name: g.group_name,
          org_name: orgName,
          creator_type: g.creator_type,
          latitude: loc.latitude,
          longitude: loc.longitude,
          accuracy: loc.accuracy,
          status: loc.status,
          battery_level: loc.battery_level,
          last_updated: loc.timestamp.toISOString(),
          resources: g.resourceAllocations.map((r) => r.inventoryItem.item),
          active_assignment: activeAssignment
            ? {
                assignment_id: activeAssignment.id,
                disaster_report_id: activeAssignment.disaster_report_id,
                assigned_at: activeAssignment.assigned_at.toISOString(),
              }
            : null,
        };
      });
  }

  // ===================== ASSIGNMENT SYSTEM =====================

  /**
   * Recommend best team(s) for a given disaster report
   * Scores teams based on: proximity + resource match + availability
   */
  async recommendTeams(disasterReportId: string, userId: string, role: string) {
    const actualEntityId = await this.getActualEntityId(userId, role);

    // Get the disaster report
    const report = await this.prisma.disasterReport.findUnique({
      where: { id: disasterReportId },
    });
    if (!report) throw new NotFoundException(`Disaster report ${disasterReportId} not found`);

    const reportLat = report.latitude;
    const reportLng = report.longitude;

    // Parse resources needed from comma-separated string
    const resourcesNeeded = report.resources_needed
      ? report.resources_needed.split(',').map((r) => r.trim().toLowerCase())
      : [];

    // Get all active groups belonging to this org with their locations
    const groups = await this.prisma.group.findMany({
      where: {
        creator_id: actualEntityId,
        is_active: true,
      },
      include: {
        location: true,
        resourceAllocations: { include: { inventoryItem: true } },
        assignments: {
          where: { status: 'active' },
          orderBy: { assigned_at: 'desc' },
          take: 1,
        },
      },
    });

    const scored = groups
      .filter((g) => g.location !== null) // only groups with known location
      .map((g) => {
        const loc = g.location!;
        const distanceKm =
          reportLat && reportLng
            ? haversineDistance(loc.latitude, loc.longitude, reportLat, reportLng)
            : 9999;

        // Resource match score (0-1): what fraction of needed resources this group has
        const groupResources = g.resourceAllocations.map((r) => r.inventoryItem.item.toLowerCase());
        const matchedResources = resourcesNeeded.filter((needed) =>
          groupResources.some((r) => r.includes(needed) || needed.includes(r)),
        );
        const resourceMatchScore = resourcesNeeded.length > 0 ? matchedResources.length / resourcesNeeded.length : 1;

        // Status score: available=1.0, deployed=0.5, rescuing=0.3, offline=0
        const statusScores: Record<string, number> = { available: 1.0, deployed: 0.5, rescuing: 0.3, offline: 0 };
        const statusScore = statusScores[loc.status] ?? 0.5;

        // Already assigned to another active incident?
        const alreadyAssigned = g.assignments.length > 0;

        // Composite score: lower is better for distance, higher is better for others
        // Normalize distance: score = 1 / (1 + distanceKm/10)
        const proximityScore = 1 / (1 + distanceKm / 10);
        const compositeScore = proximityScore * 0.5 + resourceMatchScore * 0.35 + statusScore * 0.15;

        return {
          group_id: g.id,
          group_name: g.group_name,
          latitude: loc.latitude,
          longitude: loc.longitude,
          status: loc.status,
          battery_level: loc.battery_level,
          last_updated: loc.timestamp.toISOString(),
          distance_km: Math.round(distanceKm * 10) / 10,
          resource_match_score: Math.round(resourceMatchScore * 100),
          matched_resources: matchedResources,
          missing_resources: resourcesNeeded.filter((needed) => !matchedResources.includes(needed)),
          available_resources: groupResources,
          already_assigned: alreadyAssigned,
          composite_score: Math.round(compositeScore * 100),
          current_assignment: g.assignments[0] || null,
        };
      })
      .sort((a, b) => b.composite_score - a.composite_score);

    return {
      success: true,
      disaster_report: {
        id: report.id,
        city: report.city,
        severity: report.severity,
        resources_needed: resourcesNeeded,
        latitude: reportLat,
        longitude: reportLng,
      },
      recommendations: scored,
      total_available: scored.length,
    };
  }

  /**
   * Assign a group to a disaster report (NGO admin confirms)
   */
  async assignGroup(groupId: string, dto: AssignGroupDto, userId: string, role: string) {
    const actualEntityId = await this.getActualEntityId(userId, role);

    // Verify ownership of the group
    const group = await this.prisma.group.findUnique({ where: { id: groupId } });
    if (!group) throw new NotFoundException(`Group ${groupId} not found`);
    if (group.creator_id !== actualEntityId) throw new ForbiddenException('You do not own this group');
    if (!group.is_active) throw new ForbiddenException('Group is inactive');

    // Verify the disaster report exists
    const report = await this.prisma.disasterReport.findUnique({ where: { id: dto.disaster_report_id } });
    if (!report) throw new NotFoundException(`Disaster report ${dto.disaster_report_id} not found`);

    // Cancel any existing active assignment for this group
    await this.prisma.groupAssignment.updateMany({
      where: { group_id: groupId, status: 'active' },
      data: { status: 'cancelled' },
    });

    // Create new assignment
    const assignment = await this.prisma.groupAssignment.create({
      data: {
        group_id: groupId,
        disaster_report_id: dto.disaster_report_id,
        assigned_by: userId,
        assigned_by_type: role,
        status: 'active',
        notes: dto.notes,
      },
    });

    // Update group location status to 'deployed'
    await this.prisma.groupLocation.updateMany({
      where: { group_id: groupId },
      data: { status: 'deployed' },
    });

    // Update disaster report: mark as team_assigned and record which group
    await this.prisma.disasterReport.update({
      where: { id: dto.disaster_report_id },
      data: { resolved_by: groupId, status: 'team_assigned' },
    });

    return {
      success: true,
      message: `Group "${group.group_name}" assigned to incident`,
      assignment,
    };
  }

  /**
   * Get all active assignments for the organization
   */
  async getAssignments(userId: string, role: string) {
    const actualEntityId = await this.getActualEntityId(userId, role);

    const groups = await this.prisma.group.findMany({
      where: { creator_id: actualEntityId },
      select: { id: true },
    });
    const groupIds = groups.map((g) => g.id);

    const assignments = await this.prisma.groupAssignment.findMany({
      where: { group_id: { in: groupIds } },
      include: {
        group: {
          include: {
            location: true,
            resourceAllocations: { include: { inventoryItem: { select: { item: true, total_quantity: true } } } },
          },
        },
      },
      orderBy: { assigned_at: 'desc' },
    });

    return {
      success: true,
      assignments: assignments.map((a) => {
        const g = a.group;
        return {
          assignment_id: a.id,
          group_id: g.id,
          group_name: g.group_name,
          disaster_report_id: a.disaster_report_id,
          assigned_at: a.assigned_at.toISOString(),
          status: a.status,
          notes: a.notes,
          completed_at: a.completed_at?.toISOString() || null,
          group_location: g.location
            ? {
                latitude: g.location.latitude,
                longitude: g.location.longitude,
                status: g.location.status,
                last_updated: g.location.timestamp.toISOString(),
              }
            : null,
          resources: g.resourceAllocations.map((r) => ({
            item: r.inventoryItem.item,
            quantity: r.allocated_quantity,
          })),
        };
      }),
    };
  }

  /**
   * Update assignment status (complete or cancel)
   */
  async updateAssignmentStatus(assignmentId: string, dto: UpdateAssignmentStatusDto, userId: string, role: string) {
    const actualEntityId = await this.getActualEntityId(userId, role);

    const assignment = await this.prisma.groupAssignment.findUnique({
      where: { id: assignmentId },
      include: { group: true },
    });
    if (!assignment) throw new NotFoundException(`Assignment ${assignmentId} not found`);
    if (assignment.group.creator_id !== actualEntityId) throw new ForbiddenException('You do not own this group');

    const updated = await this.prisma.groupAssignment.update({
      where: { id: assignmentId },
      data: {
        status: dto.status,
        notes: dto.notes || assignment.notes,
        completed_at: dto.status === 'completed' || dto.status === 'cancelled' ? new Date() : null,
      },
    });

    // If completed/cancelled, set group back to available
    if (dto.status === 'completed' || dto.status === 'cancelled') {
      await this.prisma.groupLocation.updateMany({
        where: { group_id: assignment.group_id },
        data: { status: 'available' },
      });
    }

    // Propagate status to disaster report
    if (dto.status === 'completed') {
      await this.prisma.disasterReport.update({
        where: { id: assignment.disaster_report_id },
        data: { status: 'resolved', resolved_at: new Date() },
      });
    } else if (dto.status === 'cancelled') {
      // Reset disaster report back to pending so it can be re-assigned
      await this.prisma.disasterReport.update({
        where: { id: assignment.disaster_report_id },
        data: { status: 'pending', resolved_by: null },
      });
    }

    return { success: true, message: `Assignment ${dto.status}`, assignment: updated };
  }

  /**
   * Group self-reports its operational status (available / deployed / rescuing)
   * If 'rescuing', sets the active disaster_report.status = 'in_progress'
   */
  async updateOperationStatus(groupId: string, dto: UpdateOperationStatusDto) {
    const group = await this.prisma.group.findUnique({ where: { id: groupId } });
    if (!group) throw new NotFoundException(`Group ${groupId} not found`);
    if (!group.is_active) throw new ForbiddenException('This group is inactive');

    // Update the group's location status
    await this.prisma.groupLocation.updateMany({
      where: { group_id: groupId },
      data: { status: dto.status },
    });

    // If reporting 'rescuing', set the active disaster report to in_progress
    if (dto.status === 'rescuing') {
      const activeAssignment = await this.prisma.groupAssignment.findFirst({
        where: { group_id: groupId, status: 'active' },
        orderBy: { assigned_at: 'desc' },
      });
      if (activeAssignment) {
        await this.prisma.disasterReport.update({
          where: { id: activeAssignment.disaster_report_id },
          data: { status: 'in_progress' },
        });
      }
    }

    return { success: true, message: `Status updated to '${dto.status}'` };
  }

  /**
   * Group marks its active mission as complete (group-role JWT)
   * Sets assignment.status = 'completed', disaster_report.status = 'resolved',
   * and resets group_locations.status = 'available'
   */
  async completeMyAssignment(groupId: string, dto: CompleteAssignmentDto) {
    const group = await this.prisma.group.findUnique({ where: { id: groupId } });
    if (!group) throw new NotFoundException(`Group ${groupId} not found`);

    const assignment = await this.prisma.groupAssignment.findFirst({
      where: { group_id: groupId, status: 'active' },
      orderBy: { assigned_at: 'desc' },
    });
    if (!assignment) throw new NotFoundException('No active assignment found for this group');

    // Mark assignment as completed
    await this.prisma.groupAssignment.update({
      where: { id: assignment.id },
      data: {
        status: 'completed',
        completed_at: new Date(),
        notes: dto.notes || assignment.notes,
      },
    });

    // Resolve the disaster report
    await this.prisma.disasterReport.update({
      where: { id: assignment.disaster_report_id },
      data: { status: 'resolved', resolved_at: new Date() },
    });

    // Reset group to available
    await this.prisma.groupLocation.updateMany({
      where: { group_id: groupId },
      data: { status: 'available' },
    });

    return { success: true, message: 'Mission marked as complete. Report resolved.' };
  }

  /**
   * Get the current assignment for a group (called from group-role JWT)
   */
  async getGroupCurrentAssignment(groupId: string) {
    const assignment = await this.prisma.groupAssignment.findFirst({
      where: { group_id: groupId, status: 'active' },
      orderBy: { assigned_at: 'desc' },
    });

    if (!assignment) {
      return { success: true, assignment: null, message: 'No active assignment' };
    }

    const report = await this.prisma.disasterReport.findUnique({
      where: { id: assignment.disaster_report_id },
    });

    // Fetch citizen contact info if this is a user-submitted report
    let citizenInfo: {
      full_name: string | null;
      phone_number: string | null;
      blood_group: string | null;
      medical_conditions: string | null;
      allergies: string | null;
      emergency_contact_name: string | null;
      emergency_contact_phone: string | null;
      emergency_contact_relation: string | null;
    } | null = null;

    if (report?.user_id) {
      const user = await this.prisma.user.findUnique({
        where: { id: report.user_id },
        select: {
          full_name: true,
          phone_number: true,
          blood_group: true,
          medical_conditions: true,
          allergies: true,
          emergency_contact_name: true,
          emergency_contact_phone: true,
          emergency_contact_relation: true,
        },
      });
      if (user) citizenInfo = user;
    }

    return {
      success: true,
      assignment: {
        assignment_id: assignment.id,
        disaster_report_id: assignment.disaster_report_id,
        assigned_at: assignment.assigned_at.toISOString(),
        notes: assignment.notes,
        incident: report
          ? {
              city: report.city,
              pincode: report.pincode,
              severity: report.severity,
              latitude: report.latitude,
              longitude: report.longitude,
              notes: report.notes,
              resources_needed: report.resources_needed,
              water_level: report.water_level,
              is_sos: report.is_sos,
              status: report.status,
            }
          : null,
        citizen: citizenInfo,
      },
    };
  }
}
