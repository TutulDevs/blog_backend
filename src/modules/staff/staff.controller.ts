import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { StaffService } from './staff.service';
import {
  AuthenticatedStaff,
  JwtAuthGuard,
} from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { StaffRole } from '../../lib/coreconstants';
import { UpdateStaffRoleDto, UpdateStaffStatusDto } from './dto/staff.dto';
import { TransformPostInterceptor } from 'src/common/interceptors/transform_post.interceptor';
import { UserEntity } from 'src/common/decorators/user.decorator';

@ApiTags('staff')
@ApiBearerAuth()
@Controller('staff')
@UseGuards(JwtAuthGuard, RolesGuard)
@UseInterceptors(TransformPostInterceptor)
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
  getAllStaffs(@UserEntity() user: AuthenticatedStaff) {
    return this.staffService.getAllStaffs(user.role);
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
