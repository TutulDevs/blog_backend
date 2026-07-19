import {
  Body,
  Delete,
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
import { B_PostService } from './post.service';
import { B_JwtAuthGuard } from '../../../common/guards/b_jwt_auth.guard';
import { B_RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { StaffRole } from '../../../lib/coreconstants';
import { GetAllPostsQueryDto, UpdatePostStatusDto } from './dto/post.dto';
import { BackofficeController } from '../../../common/decorators/route.decorator';
import { BackofficeApiTags } from '../../../common/decorators/api_tag.decorator';

@BackofficeApiTags('posts')
@ApiBearerAuth()
@BackofficeController('posts')
@UseGuards(B_JwtAuthGuard, B_RolesGuard)
export class B_PostController {
  constructor(private readonly postService: B_PostService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get all posts' })
  @ApiResponse({
    status: 200,
    description: 'Request successful, returns all the posts',
  })
  @ApiResponse({ status: 401, description: 'Not logged in or unauthorized' })
  getAllPosts(@Query() query: GetAllPostsQueryDto) {
    return this.postService.getAllPosts(query);
  }

  @Get(':slug')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get post by slug' })
  @ApiResponse({
    status: 200,
    description: 'Request successful, returns the post',
  })
  @ApiResponse({ status: 401, description: 'Not logged in or unauthorized' })
  @ApiResponse({ status: 404, description: 'Post not found' })
  getPostBySlug(@Param('slug') slug: string) {
    return this.postService.getPostBySlug(slug);
  }

  @Patch(':id/status')
  @Roles(StaffRole.ADMIN, StaffRole.EDITOR)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update post status (admin & editor only)' })
  @ApiResponse({
    status: 200,
    description: 'Request successful, returns the updated post',
  })
  @ApiResponse({ status: 401, description: 'Not logged in or unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Logged in but not permitted (non-staff)',
  })
  @ApiResponse({ status: 404, description: 'Post not found' })
  updatePostStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdatePostStatusDto,
  ) {
    return this.postService.updatePostStatus(id, dto.status);
  }

  @Delete(':id')
  @Roles(StaffRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a post (admin only)' })
  @ApiResponse({ status: 200, description: 'Post deleted successfully' })
  @ApiResponse({ status: 401, description: 'Not logged in or unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Logged in but not permitted (non-admin)',
  })
  @ApiResponse({ status: 404, description: 'Post not found' })
  deletePost(@Param('id', ParseIntPipe) id: number) {
    return this.postService.deletePost(id);
  }
}
