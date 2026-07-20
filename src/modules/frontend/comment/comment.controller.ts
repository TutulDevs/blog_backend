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
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { CommentService } from './comment.service';
import { AuthenticatedUser } from '../../../common/guards/auth-payload.types';
import { F_JwtAuthGuard } from '../../../common/guards/f_jwt_auth.guard';
import { UserStatusGuard } from '../../../common/guards/user_status.guard';
import { OptionalAuth } from '../../../common/decorators/optional_auth.decorator';
import { UserEntity } from '../../../common/decorators/user.decorator';
import {
  CreateCommentDto,
  GetCommentsByPostIdQueryDto,
  UpdateCommentDto,
} from './dto/comment.dto';
import { FrontendController } from 'src/common/decorators/route.decorator';
import { FrontendApiTags } from 'src/common/decorators/api_tag.decorator';

@FrontendApiTags('comments')
@ApiBearerAuth()
@FrontendController('comments')
@UseGuards(F_JwtAuthGuard)
export class CommentController {
  constructor(private readonly commentService: CommentService) {}

  @Post()
  @UseGuards(UserStatusGuard)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create a new comment',
  })
  @ApiResponse({ status: 201, description: 'Comment created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid body' })
  @ApiResponse({ status: 404, description: 'Post not found' })
  createComment(
    @Body() dto: CreateCommentDto,
    @UserEntity() authUser: AuthenticatedUser,
  ) {
    return this.commentService.createComment(dto, authUser.id);
  }

  @Patch(':id')
  @UseGuards(UserStatusGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update comment content' })
  @ApiResponse({
    status: 200,
    description: 'Request successful, returns message',
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
    return this.commentService.updateComment(id, dto, authUser.id);
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
    return this.commentService.deleteComment(id, authUser.id);
  }

  @Get(':parentId/replies')
  @HttpCode(HttpStatus.OK)
  @OptionalAuth()
  @ApiOperation({ summary: 'Get replies of a comment of a post' })
  getCommentsByPostId(
    @Param('parentId', ParseIntPipe) parentId: number,
    @Query() query: GetCommentsByPostIdQueryDto,
    // @UserEntity() authUser?: AuthenticatedUser,
  ) {
    return this.commentService.getCommentReplies(parentId, query);
  }
}
