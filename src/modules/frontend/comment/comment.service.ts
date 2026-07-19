import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { CommentStatus } from '../../../lib/coreconstants';
import {
  CreateCommentDto,
  GetAllCommentsQueryDto,
  UpdateCommentDto,
} from './dto/comment.dto';
import {
  AuthenticatedUser,
  isStaffUser,
} from 'src/common/guards/auth-payload.types';

const COMMENT_INCLUDE = {
  user: {
    select: { id: true, username: true, name: true },
  },
} as Prisma.CommentInclude;

@Injectable()
export class CommentService {
  constructor(private readonly prisma: PrismaService) {}

  private assertOwnerOrStaff(
    comment: { userId: number | null },
    authUser: AuthenticatedUser,
  ) {
    if (isStaffUser(authUser)) return;

    if (comment.userId === null || comment.userId !== authUser.id) {
      throw new ForbiddenException(
        'You do not have permission to modify this comment',
      );
    }
  }

  private async findCommentByIdOrThrow(id: number) {
    const comment = await this.prisma.comment.findUnique({ where: { id } });

    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    return comment;
  }

  private async assertPostExists(postId: number) {
    const post = await this.prisma.post.findUnique({ where: { id: postId } });

    if (!post) {
      throw new NotFoundException('Post not found');
    }
  }

  async createComment(dto: CreateCommentDto, authUser?: AuthenticatedUser) {
    await this.assertPostExists(dto.postId);

    const isAuthor = !!authUser && !isStaffUser(authUser);

    if (!isAuthor && (!dto.guestName || !dto.guestEmail)) {
      throw new BadRequestException(
        'guestName and guestEmail are required when not logged in as an author',
      );
    }

    try {
      const comment = await this.prisma.comment.create({
        data: {
          content: dto.content,
          postId: dto.postId,
          userId: isAuthor ? authUser.id : null,
          guestName: isAuthor ? null : dto.guestName,
          guestEmail: isAuthor ? null : dto.guestEmail,
          status: CommentStatus.PENDING,
        },
        include: COMMENT_INCLUDE,
      });

      return { comment };
    } catch (error) {
      // narrows the race window between the assertPostExists check above
      // and this create — the post (or the author's account) being deleted
      // in that gap would otherwise surface as a raw 500
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2003'
      ) {
        throw new BadRequestException('Invalid post or user reference');
      }

      throw error;
    }
  }

  async getAllComments(query: GetAllCommentsQueryDto) {
    const { postId, userId, status, sortBy, sortOrder, page, limit } = query;

    const where: Prisma.CommentWhereInput = {};

    if (postId !== undefined) {
      where.postId = postId;
    }

    if (userId !== undefined) {
      where.userId = userId;
    }

    if (status !== undefined) {
      where.status = status;
    }

    const skip = (page - 1) * limit;
    const take = limit;

    const [totalFilteredComments, comments] = await Promise.all([
      this.prisma.comment.count({ where }),
      this.prisma.comment.findMany({
        where,
        skip,
        take,
        orderBy: !sortBy ? { createdAt: 'desc' } : { [sortBy]: sortOrder },
        include: COMMENT_INCLUDE,
      }),
    ]);

    return {
      meta: {
        totalCount: totalFilteredComments,
        page,
        limit,
        totalPages: Math.ceil(totalFilteredComments / limit),
      },
      list: comments,
    };
  }

  async getCommentById(id: number) {
    const comment = await this.prisma.comment.findUnique({
      where: { id },
      include: COMMENT_INCLUDE,
    });

    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    return { comment };
  }

  async updateComment(
    id: number,
    dto: UpdateCommentDto,
    authUser: AuthenticatedUser,
  ) {
    const comment = await this.findCommentByIdOrThrow(id);
    this.assertOwnerOrStaff(comment, authUser);

    const updated = await this.prisma.comment.update({
      where: { id },
      data: { content: dto.content },
      include: COMMENT_INCLUDE,
    });

    return { comment: updated };
  }

  async updateCommentStatus(id: number, status: CommentStatus) {
    await this.findCommentByIdOrThrow(id);

    const comment = await this.prisma.comment.update({
      where: { id },
      data: { status },
      include: COMMENT_INCLUDE,
    });

    return { comment };
  }

  async deleteComment(id: number, authUser: AuthenticatedUser) {
    const comment = await this.findCommentByIdOrThrow(id);
    this.assertOwnerOrStaff(comment, authUser);

    await this.prisma.comment.delete({ where: { id } });

    return { message: 'Comment deleted successfully' };
  }
}
