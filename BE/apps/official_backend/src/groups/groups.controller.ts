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
  Query,
} from '@nestjs/common';
import { GroupsService } from './groups.service';
import { CreateGroupDto } from './dto/create-group.dto';
import { UpdateGroupDto } from './dto/update-group.dto';
import { GroupSignInDto } from './dto/group-signin.dto';
import { UpdateGroupLocationDto } from './dto/group-location.dto';
import { AssignGroupDto, UpdateAssignmentStatusDto, UpdateOperationStatusDto, CompleteAssignmentDto } from './dto/group-assignment.dto';
import { JwtAuthGuard } from '../../../../libs/auth/jwt-auth.guard';
import { RolesGuard } from '../../../../libs/auth/roles.guard';
import { Roles } from '../../../../libs/auth/roles.decorator';

@Controller('groups')
export class GroupsController {
  constructor(private readonly groupsService: GroupsService) {}

  // ===================== CRUD =====================

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ngo', 'govt', 'volunteer')
  create(@Body() createDto: CreateGroupDto, @Request() req) {
    const user = req.user as { userId: string; role: string };
    return this.groupsService.create(createDto, user.userId, user.role);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ngo', 'govt', 'volunteer')
  findAll(@Request() req) {
    const user = req.user as { userId: string; role: string };
    return this.groupsService.findAll(user.userId, user.role);
  }

  @Post('signin')
  signIn(@Body() signInDto: GroupSignInDto) {
    return this.groupsService.signIn(signInDto);
  }

  // ===================== LOCATION TRACKING =====================

  /**
   * Get all active group locations (map view)
   * Accessible by NGO/Govt/Volunteer
   * MUST be before @Get(':id') to avoid being captured as id='locations'
   */
  @Get('locations/all')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ngo', 'govt', 'volunteer')
  getAllGroupLocations() {
    return this.groupsService.getAllGroupLocations();
  }

  // ===================== SMART ROUTING / ASSIGNMENT =====================

  /**
   * Recommend best teams for a given incident
   * ?incident_id=xxx
   * MUST be before @Get(':id') to avoid being captured as id='recommend'
   */
  @Get('recommend')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ngo', 'govt', 'volunteer')
  recommendTeams(@Query('incident_id') incidentId: string, @Request() req) {
    const user = req.user as { userId: string; role: string };
    return this.groupsService.recommendTeams(incidentId, user.userId, user.role);
  }

  /**
   * Get all assignments for this organization
   * MUST be before @Get(':id') to avoid being captured as id='assignments'
   */
  @Get('assignments/all')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ngo', 'govt', 'volunteer')
  getAssignments(@Request() req) {
    const user = req.user as { userId: string; role: string };
    return this.groupsService.getAssignments(user.userId, user.role);
  }

  /**
   * Update an assignment status (complete / cancel)
   * MUST be before @Patch(':id') to avoid being captured as id='assignments'
   */
  @Patch('assignments/:assignmentId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ngo', 'govt', 'volunteer')
  updateAssignmentStatus(
    @Param('assignmentId') assignmentId: string,
    @Body() dto: UpdateAssignmentStatusDto,
    @Request() req,
  ) {
    const user = req.user as { userId: string; role: string };
    return this.groupsService.updateAssignmentStatus(assignmentId, dto, user.userId, user.role);
  }

  /**
   * Group gets its own current assignment (group-role JWT)
   * MUST be before @Get(':id') to avoid being captured as id='me'
   */
  @Get('me/assignment')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('group')
  getMyAssignment(@Request() req) {
    const user = req.user as { userId: string; role: string };
    return this.groupsService.getGroupCurrentAssignment(user.userId);
  }

  /**
   * Group self-reports operational status (available / deployed / rescuing)
   * Called from group-role JWT only
   * MUST be before @Patch(':id') to avoid collision
   */
  @Patch('me/operation-status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('group')
  updateMyOperationStatus(@Body() dto: UpdateOperationStatusDto, @Request() req) {
    const user = req.user as { userId: string; role: string };
    return this.groupsService.updateOperationStatus(user.userId, dto);
  }

  /**
   * Group marks its active mission as complete
   * Called from group-role JWT only
   * MUST be before @Patch(':id') to avoid collision
   */
  @Patch('me/complete-assignment')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('group')
  completeMyAssignment(@Body() dto: CompleteAssignmentDto, @Request() req) {
    const user = req.user as { userId: string; role: string };
    return this.groupsService.completeMyAssignment(user.userId, dto);
  }

  // ===================== PARAMETERIZED ROUTES (must come last) =====================

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ngo', 'govt', 'volunteer')
  findOne(@Param('id') id: string, @Request() req) {
    const user = req.user as { userId: string; role: string };
    return this.groupsService.findOne(id, user.userId, user.role);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ngo', 'govt', 'volunteer')
  update(
    @Param('id') id: string,
    @Body() updateDto: UpdateGroupDto,
    @Request() req,
  ) {
    const user = req.user as { userId: string; role: string };
    return this.groupsService.update(id, updateDto, user.userId, user.role);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ngo', 'govt', 'volunteer')
  remove(@Param('id') id: string, @Request() req) {
    const user = req.user as { userId: string; role: string };
    return this.groupsService.remove(id, user.userId, user.role);
  }

  /**
   * Group pings its own GPS location
   * Called from group-role JWT only
   */
  @Post(':id/location')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('group')
  updateGroupLocation(
    @Param('id') id: string,
    @Body() dto: UpdateGroupLocationDto,
    @Request() req,
  ) {
    // Ensure the group can only update its own location
    const user = req.user as { userId: string; role: string };
    return this.groupsService.updateGroupLocation(user.userId, dto);
  }

  /**
   * Assign a group to an incident (admin confirms)
   */
  @Post(':id/assign')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ngo', 'govt', 'volunteer')
  assignGroup(
    @Param('id') id: string,
    @Body() dto: AssignGroupDto,
    @Request() req,
  ) {
    const user = req.user as { userId: string; role: string };
    return this.groupsService.assignGroup(id, dto, user.userId, user.role);
  }
}
