import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../../../libs/prisma/src/prisma.service';
import { CreateInventoryDto } from './dto/create-inventory.dto';
import { UpdateInventoryDto } from './dto/update-inventory.dto';

@Injectable()
export class InventoryService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Helper method to get the actual entity ID (ngo_id or volunteer_id) from AllUsers table
   * The userId passed from JWT is the allUsers.id, not the actual NGO/Volunteer ID
   */
  private async getActualEntityId(userId: string, role: string): Promise<string> {
    const allUser = await this.prisma.allUsers.findUnique({
      where: { id: userId },
    });

    if (!allUser) {
      throw new NotFoundException(`User with ID ${userId} not found in database.`);
    }

    if (role === 'ngo') {
      if (!allUser.ngo_id) {
        throw new NotFoundException(`NGO ID not found for user ${userId}. Please ensure you are logged in with a valid NGO account.`);
      }
      return allUser.ngo_id;
    } else if (role === 'volunteer') {
      if (!allUser.volunteer_id) {
        throw new NotFoundException(`Volunteer ID not found for user ${userId}. Please ensure you are logged in with a valid Volunteer account.`);
      }
      return allUser.volunteer_id;
    }

    throw new ForbiddenException('Invalid role for inventory management');
  }

  async create(createDto: CreateInventoryDto, userId: string, role: string) {
    console.log('[InventoryService] Create inventory called with:', {
      userId,
      role,
      item: createDto.item,
      quantity: createDto.total_quantity,
    });

    if (role !== 'ngo' && role !== 'volunteer') {
      throw new ForbiddenException(
        'Only NGOs and volunteers can manage inventory',
      );
    }

    // Get the actual entity ID (ngo_id or volunteer_id)
    const actualEntityId = await this.getActualEntityId(userId, role);

    const data = {
      item: createDto.item,
      total_quantity: createDto.total_quantity,
      ngo_id: role === 'ngo' ? actualEntityId : null,
      volunteer_id: role === 'volunteer' ? actualEntityId : null,
    };

    console.log('[InventoryService] Creating inventory item with data:', data);
    return this.prisma.inventoryItem.create({ data });
  }

  async findAll(userId: string, role: string) {
    if (role !== 'ngo' && role !== 'volunteer') {
      throw new ForbiddenException(
        'Only NGOs and volunteers can view inventory',
      );
    }

    // Get the actual entity ID (ngo_id or volunteer_id)
    const actualEntityId = await this.getActualEntityId(userId, role);

    const where =
      role === 'ngo' ? { ngo_id: actualEntityId } : { volunteer_id: actualEntityId };

    const items = await this.prisma.inventoryItem.findMany({
      where,
      include: {
        groupAllocations: {
          select: {
            allocated_quantity: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Calculate remaining quantity for each item
    return items.map((item) => {
      const totalAllocated = item.groupAllocations.reduce(
        (sum, allocation) => sum + allocation.allocated_quantity,
        0,
      );
      const { groupAllocations, ...itemData } = item;
      return {
        ...itemData,
        remaining_quantity: item.total_quantity - totalAllocated,
      };
    });
  }

  async findOne(id: string, userId: string, role: string) {
    if (role !== 'ngo' && role !== 'volunteer') {
      throw new ForbiddenException(
        'Only NGOs and volunteers can view inventory',
      );
    }

    // Get the actual entity ID (ngo_id or volunteer_id)
    const actualEntityId = await this.getActualEntityId(userId, role);

    const item = await this.prisma.inventoryItem.findUnique({
      where: { id },
      include: {
        groupAllocations: {
          select: {
            allocated_quantity: true,
          },
        },
      },
    });

    if (!item) {
      throw new NotFoundException(`Inventory item with ID ${id} not found`);
    }

    // Verify ownership
    if (role === 'ngo' && item.ngo_id !== actualEntityId) {
      throw new ForbiddenException(
        'You do not have access to this inventory item',
      );
    }
    if (role === 'volunteer' && item.volunteer_id !== actualEntityId) {
      throw new ForbiddenException(
        'You do not have access to this inventory item',
      );
    }

    // Calculate remaining quantity
    const totalAllocated = item.groupAllocations.reduce(
      (sum, allocation) => sum + allocation.allocated_quantity,
      0,
    );
    const { groupAllocations, ...itemData } = item;
    return {
      ...itemData,
      remaining_quantity: item.total_quantity - totalAllocated,
    };
  }

  async update(
    id: string,
    updateDto: UpdateInventoryDto,
    userId: string,
    role: string,
  ) {
    if (role !== 'ngo' && role !== 'volunteer') {
      throw new ForbiddenException(
        'Only NGOs and volunteers can update inventory',
      );
    }

    await this.findOne(id, userId, role);

    return this.prisma.inventoryItem.update({
      where: { id },
      data: updateDto,
    });
  }

  async remove(id: string, userId: string, role: string) {
    if (role !== 'ngo' && role !== 'volunteer') {
      throw new ForbiddenException(
        'Only NGOs and volunteers can delete inventory',
      );
    }

    await this.findOne(id, userId, role);

    return this.prisma.inventoryItem.delete({ where: { id } });
  }
}
