import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
} from '@nestjs/common';
import { InventoryService } from './inventory.service';
import { CreateInventoryDto } from './dto/create-inventory.dto';
import { UpdateInventoryDto } from './dto/update-inventory.dto';
import { JwtAuthGuard } from '../../../../libs/auth/jwt-auth.guard';
import { RolesGuard } from '../../../../libs/auth/roles.guard';
import { Roles } from '../../../../libs/auth/roles.decorator';

@Controller('inventory')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ngo', 'volunteer')
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Post()
  create(@Body() createDto: CreateInventoryDto, @Request() req) {
    const user = req.user as { userId: string; role: string };
    return this.inventoryService.create(createDto, user.userId, user.role);
  }

  @Get()
  findAll(@Request() req) {
    const user = req.user as { userId: string; role: string };
    return this.inventoryService.findAll(user.userId, user.role);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Request() req) {
    const user = req.user as { userId: string; role: string };
    return this.inventoryService.findOne(id, user.userId, user.role);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateDto: UpdateInventoryDto,
    @Request() req,
  ) {
    const user = req.user as { userId: string; role: string };
    return this.inventoryService.update(id, updateDto, user.userId, user.role);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Request() req) {
    const user = req.user as { userId: string; role: string };
    return this.inventoryService.remove(id, user.userId, user.role);
  }
}
