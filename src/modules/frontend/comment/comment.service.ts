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
  GetCommentsByPostIdQueryDto,
  UpdateCommentDto,
} from './dto/comment.dto';

@Injectable()
export class CommentService {
  constructor(private readonly prisma: PrismaService) {}

  private async findCommentByIdOrThrow(id: number) {
    const comment = await this.prisma.comment.findUnique({
      where: { id },
      select: {
        id: true,
        postId: true,
        userId: true,
        parentId: true,
        status: true,
      },
    });

    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    return comment;
  }

  private async assertPostExists(postId: number) {
    const post = await this.prisma.post.findUnique({
      where: { id: postId },
      select: { id: true },
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }
  }

  async createComment(dto: CreateCommentDto, authUserId: number) {
    await this.assertPostExists(dto.postId);

    if (dto.parentId) {
      const targetComment = await this.prisma.comment.findUnique({
        where: { id: dto.parentId },
        select: { id: true, parentId: true, postId: true },
      });

      // if the parent comment exists
      if (!targetComment) {
        throw new NotFoundException('Parent comment not found');
      }

      // Check: parent comment
      if (targetComment.postId !== dto.postId) {
        throw new BadRequestException(
          'Parent comment does not belong to the specified post.',
        );
      }

      // check if the comment is a reply of a comment
      if (targetComment.parentId !== null) {
        throw new BadRequestException(
          'Nested replies are not allowed. You can only reply to main comments.',
        );
      }
    }

    try {
      await this.prisma.comment.create({
        data: {
          content: dto.content,
          postId: dto.postId,
          parentId: dto?.parentId || null, // reply
          userId: authUserId,
          status: CommentStatus.APPROVED,
        },
      });

      const commentOrReplyText = dto?.parentId ? 'Reply' : 'Comment';

      return { message: commentOrReplyText + ' submitted successfully' };
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

  async updateComment(id: number, dto: UpdateCommentDto, authUserId: number) {
    const comment = await this.findCommentByIdOrThrow(id);

    if (comment.userId !== authUserId) {
      throw new ForbiddenException('You can only update your own comments');
    }

    await this.prisma.comment.update({
      where: { id },
      data: { content: dto.content },
    });

    return { message: 'Comment updated successfully' };
  }

  async deleteComment(id: number, authUserId: number) {
    const comment = await this.findCommentByIdOrThrow(id);

    const isReply = comment.parentId != null;

    if (comment.userId !== authUserId) {
      throw new ForbiddenException(
        `You do not have the access to delete this ${isReply ? 'reply' : 'comment'}`,
      );
    }

    await this.prisma.comment.delete({ where: { id } });

    return { message: `${isReply ? 'Reply' : 'Comment'} deleted successfully` };
  }

  async getCommentsByPostId(
    postId: number,
    query: GetCommentsByPostIdQueryDto,
    // authUserId?: number,
  ) {
    await this.assertPostExists(postId);

    const { limit, cursor } = query;

    const where: Prisma.CommentWhereInput = {
      postId,
      parentId: null, // only main parents - not replies
      status: CommentStatus.APPROVED, // only approved comments to be shown
    };

    const [totalOfCommentAndReplies, comments] = await Promise.all([
      this.prisma.comment.count({
        where: { postId, status: CommentStatus.APPROVED },
      }),
      this.prisma.comment.findMany({
        where,
        take: limit + 1, // to check if next page exists
        ...(cursor && { cursor: { id: cursor }, skip: 1 }),
        orderBy: { id: 'desc' }, // new comments first
        select: {
          id: true,
          content: true,
          // parentId: true,
          createdAt: true,
          updatedAt: true,
          user: { select: { id: true, username: true, name: true } },
          _count: { select: { replies: true } },
        },
      }),
    ]);

    let hasNextPage = false;
    if (comments.length > limit) {
      hasNextPage = true;
      comments.pop();
    }

    const nextCursor = hasNextPage ? comments[comments.length - 1]?.id : null;

    return {
      meta: {
        totalCount: totalOfCommentAndReplies,
        limit,
        cursor: cursor,
        nextCursor: nextCursor,
        hasNextPage: hasNextPage,
      },
      list: comments,
    };
  }

  async getCommentReplies(
    parentId: number,
    query: GetCommentsByPostIdQueryDto,
    // authUserId?: number,
  ) {
    const parentComment = await this.prisma.comment.findUnique({
      where: { id: parentId },
      select: { id: true, parentId: true, status: true },
    });

    // if it exists
    if (!parentComment || parentComment.status !== CommentStatus.APPROVED) {
      throw new NotFoundException('Parent comment not found');
    }

    // check if its a reply or not
    if (parentComment.parentId !== null) {
      throw new BadRequestException('Cannot fetch replies of a reply');
    }

    const { limit, cursor } = query;

    const where: Prisma.CommentWhereInput = {
      parentId,
      status: CommentStatus.APPROVED,
    };

    const [totalReplies, replies] = await Promise.all([
      this.prisma.comment.count({ where }),
      this.prisma.comment.findMany({
        where,
        take: limit + 1, // to check if next page exists
        ...(cursor && { cursor: { id: cursor }, skip: 1 }),
        orderBy: { id: 'asc' }, // old replies first
        select: {
          id: true,
          content: true,
          createdAt: true,
          updatedAt: true,
          user: { select: { id: true, username: true, name: true } },
        },
      }),
    ]);

    let hasNextPage = false;
    if (replies.length > limit) {
      hasNextPage = true;
      replies.pop();
    }

    const nextCursor =
      hasNextPage && replies.length > 0 ? replies[replies.length - 1].id : null;

    return {
      meta: {
        totalCount: totalReplies,
        limit,
        cursor: cursor,
        nextCursor: nextCursor,
        hasNextPage: hasNextPage,
      },
      list: replies,
    };
  }
}
