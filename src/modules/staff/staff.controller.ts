import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { StaffService } from './staff.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { StaffRole } from '../../lib/coreconstants';

@ApiTags('staff')
@ApiBearerAuth()
@Controller('staff')
@UseGuards(JwtAuthGuard, RolesGuard)
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
  getAllStaffs() {
    return this.staffService.getAllStaffs();
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
}
