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
import { F_UserService } from './user.service';
import { AuthenticatedUser } from '../../../common/guards/auth-payload.types';
import { F_JwtAuthGuard } from '../../../common/guards/f_jwt_auth.guard';
import { UserStatusGuard } from '../../../common/guards/user_status.guard';
import { OptionalAuth } from '../../../common/decorators/optional_auth.decorator';
import { UserEntity } from '../../../common/decorators/user.decorator';
import {
  GetTopAuthorsQueryDto,
  GetTrendingAuthorsQueryDto,
  UpdateMyPasswordDto,
  UpdateMyProfileDto,
} from './dto/user.dto';
import { FrontendController } from 'src/common/decorators/route.decorator';
import { FrontendApiTags } from 'src/common/decorators/api_tag.decorator';

@FrontendApiTags('user')
@FrontendController('users')
@UseGuards(F_JwtAuthGuard)
export class F_UserController {
  constructor(private readonly userService: F_UserService) {}

  @Get('me')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get my profile' })
  @ApiResponse({
    status: 200,
    description: 'Request successful, returns my profile',
  })
  @ApiResponse({ status: 401, description: 'Not logged in' })
  getMyProfile(@UserEntity() authUser: AuthenticatedUser) {
    return this.userService.getMyProfile(authUser.id);
  }

  @Patch('me')
  @UseGuards(UserStatusGuard)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update my profile (name/username/email)' })
  @ApiResponse({
    status: 200,
    description: 'Request successful, returns the updated profile',
  })
  @ApiResponse({ status: 400, description: 'Invalid body' })
  @ApiResponse({ status: 401, description: 'Not logged in' })
  @ApiResponse({ status: 409, description: 'Username or email already in use' })
  updateMyProfile(
    @Body() dto: UpdateMyProfileDto,
    @UserEntity() authUser: AuthenticatedUser,
  ) {
    return this.userService.updateMyProfile(authUser.id, dto);
  }

  @Patch('me/password')
  @UseGuards(UserStatusGuard)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update my password' })
  @ApiResponse({ status: 200, description: 'Password updated successfully' })
  @ApiResponse({ status: 400, description: 'Invalid body' })
  @ApiResponse({
    status: 401,
    description: 'Not logged in or wrong current password',
  })
  updateMyPassword(
    @Body() dto: UpdateMyPasswordDto,
    @UserEntity() authUser: AuthenticatedUser,
  ) {
    return this.userService.updateMyPassword(authUser.id, dto);
  }

  @Delete('me')
  @UseGuards(UserStatusGuard)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Deactivate my account' })
  @ApiResponse({ status: 200, description: 'Account deactivated successfully' })
  @ApiResponse({ status: 401, description: 'Not logged in' })
  deactivateMyAccount(@UserEntity() authUser: AuthenticatedUser) {
    return this.userService.deactivateMyAccount(authUser.id);
  }

  @Get('top')
  @OptionalAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get all-time top authors by published post count' })
  @ApiResponse({
    status: 200,
    description: 'Request successful, returns the top authors',
  })
  getTopAuthors(@Query() query: GetTopAuthorsQueryDto) {
    return this.userService.getTopAuthors(query);
  }

  @Get('trending')
  @OptionalAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get trending authors by recent comments received',
  })
  @ApiResponse({
    status: 200,
    description: 'Request successful, returns the trending authors',
  })
  getTrendingAuthors(@Query() query: GetTrendingAuthorsQueryDto) {
    return this.userService.getTrendingAuthors(query);
  }

  @Get(':username')
  @OptionalAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get public author profile with published posts' })
  @ApiResponse({
    status: 200,
    description: 'Request successful, returns the public profile',
  })
  @ApiResponse({ status: 404, description: 'User not found' })
  getPublicProfile(@Param('username') username: string) {
    return this.userService.getPublicProfileByUsername(username);
  }
}
