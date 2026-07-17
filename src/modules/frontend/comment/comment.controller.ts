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
import { CommentService } from './comment.service';
import { AuthenticatedUser } from '../../../common/guards/auth-payload.types';
import { F_JwtAuthGuard } from '../../../common/guards/f_jwt_auth.guard';
import { UserStatusGuard } from '../../../common/guards/user_status.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { OptionalAuth } from '../../../common/decorators/optional_auth.decorator';
import { UserEntity } from '../../../common/decorators/user.decorator';
import { StaffRole } from '../../../lib/coreconstants';
import { TransformPostInterceptor } from '../../../common/interceptors/transform_post.interceptor';
import {
  CreateCommentDto,
  GetAllCommentsQueryDto,
  UpdateCommentDto,
  UpdateCommentStatusDto,
} from './dto/comment.dto';
import { FrontendController } from 'src/common/decorators/route.decorator';
import { FrontendApiTags } from 'src/common/decorators/api_tag.decorator';

@FrontendApiTags('comments')
@ApiBearerAuth()
@FrontendController('comments')
@UseGuards(F_JwtAuthGuard)
@UseInterceptors(TransformPostInterceptor)
export class CommentController {
  constructor(private readonly commentService: CommentService) {}

  @Post()
  @OptionalAuth()
  @UseGuards(UserStatusGuard)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create a new comment (logged-in author or guest)',
  })
  @ApiResponse({ status: 201, description: 'Comment created successfully' })
  @ApiResponse({
    status: 400,
    description: 'Invalid body, or missing guestName/guestEmail for guests',
  })
  @ApiResponse({ status: 404, description: 'Post not found' })
  createComment(
    @Body() dto: CreateCommentDto,
    @UserEntity() authUser?: AuthenticatedUser,
  ) {
    return this.commentService.createComment(dto, authUser);
  }

  @Get()
  @OptionalAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get all comments (optionally filtered by post)' })
  @ApiResponse({
    status: 200,
    description: 'Request successful, returns all the comments',
  })
  getAllComments(@Query() query: GetAllCommentsQueryDto) {
    return this.commentService.getAllComments(query);
  }

  @Get(':id')
  @OptionalAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get comment by ID' })
  @ApiResponse({
    status: 200,
    description: 'Request successful, returns the comment',
  })
  @ApiResponse({ status: 404, description: 'Comment not found' })
  getCommentById(@Param('id', ParseIntPipe) id: number) {
    return this.commentService.getCommentById(id);
  }

  @Patch(':id')
  @UseGuards(UserStatusGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update comment content' })
  @ApiResponse({
    status: 200,
    description: 'Request successful, returns the updated comment',
  })
  @ApiResponse({ status: 400, description: 'Invalid id or body' })
  @ApiResponse({ status: 401, description: 'Not logged in' })
  @ApiResponse({ status: 403, description: 'Not the comment owner' })
  @ApiResponse({ status: 404, description: 'Comment not found' })
  updateComment(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateCommentDto,
    @UserEntity() authUser: AuthenticatedUser,
  ) {
    return this.commentService.updateComment(id, dto, authUser);
  }

  @Patch(':id/status')
  @Roles(StaffRole.ADMIN, StaffRole.EDITOR)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update comment status (editorial staff only)' })
  @ApiResponse({
    status: 200,
    description: 'Request successful, returns the updated comment',
  })
  @ApiResponse({ status: 400, description: 'Invalid id or status value' })
  @ApiResponse({ status: 401, description: 'Not logged in' })
  @ApiResponse({
    status: 403,
    description: 'Logged in but not permitted (non-staff)',
  })
  @ApiResponse({ status: 404, description: 'Comment not found' })
  updateCommentStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateCommentStatusDto,
  ) {
    return this.commentService.updateCommentStatus(id, dto.status);
  }

  @Delete(':id')
  @UseGuards(UserStatusGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete comment' })
  @ApiResponse({ status: 200, description: 'Comment deleted successfully' })
  @ApiResponse({ status: 400, description: 'Invalid id format' })
  @ApiResponse({ status: 401, description: 'Not logged in' })
  @ApiResponse({ status: 403, description: 'Not the comment owner' })
  @ApiResponse({ status: 404, description: 'Comment not found' })
  deleteComment(
    @Param('id', ParseIntPipe) id: number,
    @UserEntity() authUser: AuthenticatedUser,
  ) {
    return this.commentService.deleteComment(id, authUser);
  }
}
