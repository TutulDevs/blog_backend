import {
  Body,
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
import { ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { PostService } from './post.service';
import { AuthenticatedUser } from '../../../common/guards/auth-payload.types';
import { F_JwtAuthGuard } from '../../../common/guards/f_jwt_auth.guard';
import { UserStatusGuard } from '../../../common/guards/user_status.guard';
import { OptionalAuth } from '../../../common/decorators/optional_auth.decorator';
import { UserEntity } from '../../../common/decorators/user.decorator';
import { TransformPostInterceptor } from '../../../common/interceptors/transform_post.interceptor';
import {
  CreatePostDto,
  GetAllPostsQueryDto,
  UpdatePostCoverImageDto,
  UpdatePostDto,
  UpdatePostSlugDto,
} from './dto/post.dto';
import { FrontendController } from 'src/common/decorators/route.decorator';
import { FrontendApiTags } from 'src/common/decorators/api_tag.decorator';

@FrontendApiTags('posts')
@ApiBearerAuth()
@FrontendController('posts')
@UseGuards(F_JwtAuthGuard)
@UseInterceptors(TransformPostInterceptor)
export class PostController {
  constructor(private readonly postService: PostService) {}

  @Get()
  @OptionalAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get all posts (published)' })
  @ApiResponse({
    status: 200,
    description: 'Request successful, returns all the posts',
  })
  getAllPosts(
    @Query() query: GetAllPostsQueryDto,
    @UserEntity() reqUser: AuthenticatedUser,
  ) {
    return this.postService.getAllPosts(query, reqUser);
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
  getPostBySlug(
    @Param('slug') slug: string,
    @UserEntity() reqUser: AuthenticatedUser,
  ) {
    return this.postService.getPostBySlug(slug, reqUser);
  }

  @Post()
  @UseGuards(UserStatusGuard)
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
  @UseGuards(UserStatusGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update post (title/content/category/status)' })
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

  @Patch(':id/slug')
  @UseGuards(UserStatusGuard)
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
  @UseGuards(UserStatusGuard)
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
  @UseGuards(UserStatusGuard)
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
