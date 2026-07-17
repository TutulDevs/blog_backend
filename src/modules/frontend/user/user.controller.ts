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
  UseInterceptors,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { UserService } from './user.service';
import {
  AuthenticatedUser,
  JwtAuthGuard,
} from '../../../common/guards/jwt_auth.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { StaffRole } from '../../../lib/coreconstants';
import {
  GetAllUsersQueryDto,
  UpdateUserDto,
  UpdateUserStatusDto,
  UpdateUserUsernameDto,
} from './dto/user.dto';
import { TransformPostInterceptor } from '../../../common/interceptors/transform_post.interceptor';
import { OptionalAuth } from 'src/common/decorators/optional_auth.decorator';
import { UserEntity } from 'src/common/decorators/user.decorator';
import { FrontendController } from 'src/common/decorators/route.decorator';
import { FrontendApiTags } from 'src/common/decorators/api_tag.decorator';

@FrontendApiTags('user')
@ApiBearerAuth()
@FrontendController('user')
@UseGuards(JwtAuthGuard)
@UseInterceptors(TransformPostInterceptor)
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get all users list',
  })
  @ApiResponse({
    status: 200,
    description: 'Request successful, returns all the users',
  })
  @ApiResponse({
    status: 401,
    description: 'Not logged in or unauthorized',
  })
  getAllUsers(@Query() query: GetAllUsersQueryDto) {
    return this.userService.getAllUsers(query);
  }

  @Get(':id_or_username')
  @OptionalAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get user by id/username',
  })
  @ApiResponse({
    status: 200,
    description: 'Request successful, returns the user',
  })
  @ApiResponse({
    status: 401,
    description: 'Not logged in or unauthorized',
  })
  @ApiResponse({
    status: 404,
    description: 'User not found',
  })
  getUserByIdOrUsername(
    @Param('id_or_username') id_or_username: string,
    @UserEntity() user: AuthenticatedUser,
  ) {
    return this.userService.getUserByIdOrUsername(id_or_username, user);
  }

  @Get('username/:username')
  @Roles(StaffRole.ADMIN, StaffRole.EDITOR)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get user by username',
  })
  @ApiResponse({
    status: 200,
    description: 'Request successful, returns the user',
  })
  @ApiResponse({
    status: 401,
    description: 'Not logged in or unauthorized',
  })
  @ApiResponse({
    status: 404,
    description: 'User not found',
  })
  getUserByUsername(@Param('username') username: string) {
    return this.userService.getUserByUsername(username);
  }

  @Get(':id')
  @Roles(StaffRole.ADMIN, StaffRole.EDITOR)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get user by ID',
  })
  @ApiResponse({
    status: 200,
    description: 'Request successful, returns the user',
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
    status: 404,
    description: 'User not found',
  })
  getUserById(@Param('id', ParseIntPipe) id: number) {
    return this.userService.getUserById(id);
  }

  @Patch(':id')
  @Roles(StaffRole.ADMIN, StaffRole.EDITOR)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Update user (name/email)',
  })
  @ApiResponse({
    status: 200,
    description: 'Request successful, returns the updated user',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid id format or invalid body',
  })
  @ApiResponse({
    status: 401,
    description: 'Not logged in or unauthorized',
  })
  @ApiResponse({
    status: 404,
    description: 'User not found',
  })
  @ApiResponse({
    status: 409,
    description: 'Email already in use',
  })
  updateUser(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    return this.userService.updateUser(id, updateUserDto);
  }

  @Patch(':id/status')
  @Roles(StaffRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Update user status (admin only)',
  })
  @ApiResponse({
    status: 200,
    description: 'Request successful, returns the updated user',
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
    description: 'User not found',
  })
  updateUserStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateUserStatusDto: UpdateUserStatusDto,
  ) {
    return this.userService.updateUserStatus(id, updateUserStatusDto.status);
  }

  @Patch(':id/username')
  @Roles(StaffRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Update user username (admin only)',
  })
  @ApiResponse({
    status: 200,
    description: 'Request successful, returns the updated user',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid id format or invalid username',
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
    description: 'User not found',
  })
  @ApiResponse({
    status: 409,
    description: 'Username already in use',
  })
  updateUserUsername(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateUserUsernameDto: UpdateUserUsernameDto,
  ) {
    return this.userService.updateUserUsername(
      id,
      updateUserUsernameDto.username,
    );
  }

  // update password
}
