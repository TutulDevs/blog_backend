import {
  Body,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { B_UserService } from './user.service';
import { B_JwtAuthGuard } from '../../../common/guards/b_jwt_auth.guard';
import { B_RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { StaffRole } from '../../../lib/coreconstants';
import {
  GetAllUsersQueryDto,
  UpdateUserStatusDto,
  UpdateUserVerifiedDto,
} from './dto/user.dto';
import { BackofficeController } from '../../../common/decorators/route.decorator';
import { BackofficeApiTags } from '../../../common/decorators/api_tag.decorator';

@BackofficeApiTags('users')
@ApiBearerAuth()
@BackofficeController('users')
@UseGuards(B_JwtAuthGuard, B_RolesGuard)
export class B_UserController {
  constructor(private readonly userService: B_UserService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get all users list' })
  @ApiResponse({
    status: 200,
    description: 'Request successful, returns all the users',
  })
  @ApiResponse({ status: 401, description: 'Not logged in or unauthorized' })
  getAllUsers(@Query() query: GetAllUsersQueryDto) {
    return this.userService.getAllUsers(query);
  }

  @Get(':username')
  @Roles(StaffRole.ADMIN, StaffRole.EDITOR)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get user by username' })
  @ApiResponse({
    status: 200,
    description: 'Request successful, returns the user',
  })
  @ApiResponse({ status: 401, description: 'Not logged in or unauthorized' })
  @ApiResponse({ status: 404, description: 'User not found' })
  getUserByUsername(@Param('username') username: string) {
    return this.userService.getUserByUsername(username);
  }

  @Patch(':username/status')
  @Roles(StaffRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update user status (admin only)' })
  @ApiResponse({
    status: 200,
    description: 'Request successful, returns the updated user',
  })
  @ApiResponse({ status: 401, description: 'Not logged in or unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Logged in but not permitted (non-admin)',
  })
  @ApiResponse({ status: 404, description: 'User not found' })
  updateUserStatus(
    @Param('username') username: string,
    @Body() dto: UpdateUserStatusDto,
  ) {
    return this.userService.updateUserStatus(username, dto.status);
  }

  @Patch(':username/verified')
  @Roles(StaffRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update user verification status (admin only)' })
  @ApiResponse({
    status: 200,
    description: 'Request successful, returns the updated user',
  })
  @ApiResponse({ status: 401, description: 'Not logged in or unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Logged in but not permitted (non-admin)',
  })
  @ApiResponse({ status: 404, description: 'User not found' })
  updateUserVerified(
    @Param('username') username: string,
    @Body() dto: UpdateUserVerifiedDto,
  ) {
    return this.userService.updateUserVerified(username, dto.isVerified);
  }

  @Delete(':username')
  @Roles(StaffRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete user by username (admin only)' })
  @ApiResponse({ status: 200, description: 'User deleted successfully' })
  @ApiResponse({ status: 401, description: 'Not logged in or unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Logged in but not permitted (non-admin)',
  })
  @ApiResponse({ status: 404, description: 'User not found' })
  deleteUser(@Param('username') username: string) {
    return this.userService.deleteUser(username);
  }
}
