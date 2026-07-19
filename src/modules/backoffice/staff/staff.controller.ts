import {
  Body,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { StaffService } from './staff.service';
import {
  AuthenticatedUser,
  isStaffUser,
} from '../../../common/guards/auth-payload.types';
import { B_JwtAuthGuard } from '../../../common/guards/b_jwt_auth.guard';
import { B_RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { StaffRole } from '../../../lib/coreconstants';
import {
  GetAllStaffsQueryDto,
  UpdateStaffRoleDto,
  UpdateStaffStatusDto,
} from './dto/staff.dto';
import { UserEntity } from 'src/common/decorators/user.decorator';
import { BackofficeController } from 'src/common/decorators/route.decorator';
import { BackofficeApiTags } from 'src/common/decorators/api_tag.decorator';

@BackofficeApiTags('staff')
@ApiBearerAuth()
@BackofficeController('staff')
@UseGuards(B_JwtAuthGuard, B_RolesGuard)
export class StaffController {
  constructor(private readonly staffService: StaffService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get all staffs list',
  })
  @ApiResponse({
    status: 200,
    description: 'Request successful, returns all the staffs',
  })
  @ApiResponse({
    status: 401,
    description: 'Not logged in or unauthorized',
  })
  getAllStaffs(
    @UserEntity() user: AuthenticatedUser,
    @Query() query: GetAllStaffsQueryDto,
  ) {
    return this.staffService.getAllStaffs(
      isStaffUser(user) ? user.role : undefined,
      query,
    );
  }

  @Get('me')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get the currently logged in staff (based on token)',
  })
  @ApiResponse({
    status: 200,
    description: 'Request successful, returns the current staff',
  })
  @ApiResponse({
    status: 401,
    description: 'Not logged in or unauthorized',
  })
  getMe(@UserEntity() user: AuthenticatedUser) {
    return this.staffService.getStaffById(user.id);
  }

  @Get(':id')
  @Roles(StaffRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get staff by ID',
  })
  @ApiResponse({
    status: 200,
    description: 'Request successful, returns the staff',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid id format',
  })
  @ApiResponse({
    status: 401,
    description: 'Not logged in or unauthorized',
  })
  @ApiResponse({
    status: 403,
    description: 'Logged in but not permitted (non-admin)',
  })
  @ApiResponse({
    status: 404,
    description: 'Staff not found',
  })
  getStaffById(@Param('id', ParseIntPipe) id: number) {
    return this.staffService.getStaffById(id);
  }

  @Patch(':id/status')
  @Roles(StaffRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Update staff status (admin only)',
  })
  @ApiResponse({
    status: 200,
    description: 'Request successful, returns the updated staff',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid id format or invalid status value',
  })
  @ApiResponse({
    status: 401,
    description: 'Not logged in or unauthorized',
  })
  @ApiResponse({
    status: 403,
    description: 'Logged in but not permitted (non-admin)',
  })
  @ApiResponse({
    status: 404,
    description: 'Staff not found',
  })
  updateStaffStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateStaffStatusDto: UpdateStaffStatusDto,
  ) {
    return this.staffService.updateStaffStatus(id, updateStaffStatusDto.status);
  }

  @Patch(':id/role')
  @Roles(StaffRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Update staff role (admin only)',
  })
  @ApiResponse({
    status: 200,
    description: 'Request successful, returns the updated staff',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid id format or invalid role value',
  })
  @ApiResponse({
    status: 401,
    description: 'Not logged in or unauthorized',
  })
  @ApiResponse({
    status: 403,
    description: 'Logged in but not permitted (non-admin)',
  })
  @ApiResponse({
    status: 404,
    description: 'Staff not found',
  })
  updateStaffRole(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateStaffRoleDto: UpdateStaffRoleDto,
  ) {
    return this.staffService.updateStaffRole(id, updateStaffRoleDto.role);
  }
}
