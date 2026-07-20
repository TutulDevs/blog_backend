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
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { B_CommentService } from './comment.service';
import { B_JwtAuthGuard } from '../../../common/guards/b_jwt_auth.guard';
import { B_RolesGuard } from '../../../common/guards/roles.guard';
import {
  GetAllCommentsQueryDto,
  GetCommentRepliesQueryDto,
  UpdateCommentStatusDto,
} from './dto/comment.dto';
import { BackofficeController } from '../../../common/decorators/route.decorator';
import { BackofficeApiTags } from '../../../common/decorators/api_tag.decorator';

@BackofficeApiTags('comments')
@ApiBearerAuth()
@BackofficeController('comments')
@UseGuards(B_JwtAuthGuard, B_RolesGuard)
export class B_CommentController {
  constructor(private readonly commentService: B_CommentService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get all comments (all statuses) for a post' })
  @ApiResponse({
    status: 200,
    description: 'Request successful, returns all the comments',
  })
  @ApiResponse({ status: 401, description: 'Not logged in or unauthorized' })
  getAllComments(@Query() query: GetAllCommentsQueryDto) {
    return this.commentService.getAllComments(query);
  }

  @Get(':parentId/replies')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get replies of a comment (all statuses)' })
  @ApiResponse({
    status: 200,
    description: 'Request successful, returns all the replies',
  })
  @ApiResponse({ status: 400, description: 'Cannot fetch replies of a reply' })
  @ApiResponse({ status: 401, description: 'Not logged in or unauthorized' })
  @ApiResponse({ status: 404, description: 'Parent comment not found' })
  getCommentReplies(
    @Param('parentId', ParseIntPipe) parentId: number,
    @Query() query: GetCommentRepliesQueryDto,
  ) {
    return this.commentService.getCommentReplies(parentId, query);
  }

  @Patch(':id/status')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update comment status (editorial staff only)' })
  @ApiResponse({
    status: 200,
    description: 'Request successful, returns message',
  })
  @ApiResponse({ status: 400, description: 'Invalid id or status value' })
  @ApiResponse({ status: 401, description: 'Not logged in or unauthorized' })
  @ApiResponse({ status: 404, description: 'Comment not found' })
  updateCommentStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateCommentStatusDto,
  ) {
    return this.commentService.updateCommentStatus(id, dto.status);
  }
}
