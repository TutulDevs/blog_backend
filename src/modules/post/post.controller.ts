import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { PostService } from './post.service';
import {
  AuthenticatedUser,
  JwtAuthGuard,
} from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { OptionalAuth } from '../../common/decorators/optional-auth.decorator';
import { UserEntity } from '../../common/decorators/user.decorator';
import { StaffRole } from '../../lib/coreconstants';
import { TransformPostInterceptor } from '../../common/interceptors/transform_post.interceptor';
import {
  CreatePostDto,
  GetAllMyPostsQueryDto,
  GetAllPostsQueryDto,
  UpdatePostCoverImageDto,
  UpdatePostDto,
  UpdatePostSlugDto,
  UpdatePostStatusDto,
} from './dto/post.dto';

@ApiTags('posts')
@ApiBearerAuth()
@Controller('posts')
@UseGuards(JwtAuthGuard, RolesGuard)
@UseInterceptors(TransformPostInterceptor)
export class PostController {
  constructor(private readonly postService: PostService) {}

  @Get()
  @OptionalAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get all posts' })
  @ApiResponse({
    status: 200,
    description: 'Request successful, returns all the posts',
  })
  getAllPosts(@Query() query: GetAllPostsQueryDto) {
    return this.postService.getAllPosts(query);
  }

  @Get(':username')
  @OptionalAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get all posts by username' })
  @ApiResponse({
    status: 200,
    description: 'Request successful, returns all the posts by username',
  })
  getAllPostsByUsername(
    @UserEntity() reqUser: AuthenticatedUser,
    @Query() query: GetAllMyPostsQueryDto,
    @Param('username') username: string,
  ) {
    return this.postService.getAllPostsByUsername(
      username.trim().toLowerCase(),
      query,
      reqUser,
    );
  }

  @Get(':slug')
  @OptionalAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get post by slug' })
  @ApiResponse({
    status: 200,
    description: 'Request successful, returns the post',
  })
  @ApiResponse({ status: 404, description: 'Post not found' })
  getPostBySlug(@Param('slug') slug: string) {
    return this.postService.getPostBySlug(slug);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new post' })
  @ApiResponse({ status: 201, description: 'Post created successfully' })
  @ApiResponse({
    status: 400,
    description: 'Invalid body or category reference',
  })
  @ApiResponse({ status: 401, description: 'Not logged in' })
  @ApiResponse({ status: 409, description: 'Slug already in use' })
  createPost(
    @Body() dto: CreatePostDto,
    @UserEntity() authUser: AuthenticatedUser,
  ) {
    return this.postService.createPost(authUser.id, dto);
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update post (title/content/category)' })
  @ApiResponse({
    status: 200,
    description: 'Request successful, returns the updated post',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid id, body, or category reference',
  })
  @ApiResponse({ status: 401, description: 'Not logged in' })
  @ApiResponse({ status: 403, description: 'Not the post owner' })
  @ApiResponse({ status: 404, description: 'Post not found' })
  updatePost(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdatePostDto,
    @UserEntity() authUser: AuthenticatedUser,
  ) {
    return this.postService.updatePost(id, dto, authUser);
  }

  @Patch(':id/status')
  @Roles(StaffRole.ADMIN, StaffRole.EDITOR)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update post status (editorial staff only)' })
  @ApiResponse({
    status: 200,
    description: 'Request successful, returns the updated post',
  })
  @ApiResponse({ status: 400, description: 'Invalid id or status value' })
  @ApiResponse({ status: 401, description: 'Not logged in' })
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

  @Patch(':id/slug')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update post slug' })
  @ApiResponse({
    status: 200,
    description: 'Request successful, returns the updated post',
  })
  @ApiResponse({ status: 400, description: 'Invalid id or slug' })
  @ApiResponse({ status: 401, description: 'Not logged in' })
  @ApiResponse({ status: 403, description: 'Not the post owner' })
  @ApiResponse({ status: 404, description: 'Post not found' })
  @ApiResponse({ status: 409, description: 'Slug already in use' })
  updatePostSlug(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdatePostSlugDto,
    @UserEntity() authUser: AuthenticatedUser,
  ) {
    return this.postService.updatePostSlug(id, dto.slug, authUser);
  }

  @Patch(':id/cover-image')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update post cover image' })
  @ApiResponse({
    status: 200,
    description: 'Request successful, returns the updated post',
  })
  @ApiResponse({ status: 400, description: 'Invalid id or coverImage' })
  @ApiResponse({ status: 401, description: 'Not logged in' })
  @ApiResponse({ status: 403, description: 'Not the post owner' })
  @ApiResponse({ status: 404, description: 'Post not found' })
  updatePostCoverImage(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdatePostCoverImageDto,
    @UserEntity() authUser: AuthenticatedUser,
  ) {
    return this.postService.updatePostCoverImage(id, dto.coverImage, authUser);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete post' })
  @ApiResponse({ status: 200, description: 'Post deleted successfully' })
  @ApiResponse({ status: 400, description: 'Invalid id format' })
  @ApiResponse({ status: 401, description: 'Not logged in' })
  @ApiResponse({ status: 403, description: 'Not the post owner' })
  @ApiResponse({ status: 404, description: 'Post not found' })
  deletePost(
    @Param('id', ParseIntPipe) id: number,
    @UserEntity() authUser: AuthenticatedUser,
  ) {
    return this.postService.deletePost(id, authUser);
  }
}
