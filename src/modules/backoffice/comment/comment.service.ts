import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import {
  GetAllCommentsQueryDto,
  GetCommentRepliesQueryDto,
} from './dto/comment.dto';
import { CommentStatus } from '../../../lib/coreconstants';

@Injectable()
export class B_CommentService {
  constructor(private readonly prisma: PrismaService) {}

  async getAllComments(query: GetAllCommentsQueryDto) {
    const { postId, status, search, cursor, limit } = query;

    const where: Prisma.CommentWhereInput = { postId, parentId: null };

    if (status !== undefined) {
      where.status = status;
    }

    if (search) {
      where.content = { contains: search, mode: 'insensitive' };
    }

    const [totalCount, comments] = await Promise.all([
      this.prisma.comment.count({ where }),
      this.prisma.comment.findMany({
        where,
        take: limit + 1, // to check if next page exists
        ...(cursor && { cursor: { id: cursor }, skip: 1 }),
        orderBy: { id: 'desc' },
        select: {
          id: true,
          content: true,
          status: true,
          postId: true,
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
        totalCount,
        limit,
        cursor: cursor ?? null,
        nextCursor,
        hasNextPage,
      },
      list: comments,
    };
  }

  async getCommentReplies(parentId: number, query: GetCommentRepliesQueryDto) {
    const parentComment = await this.prisma.comment.findUnique({
      where: { id: parentId },
      select: { id: true, parentId: true },
    });

    if (!parentComment) {
      throw new NotFoundException('Parent comment not found');
    }

    if (parentComment.parentId !== null) {
      throw new BadRequestException('Cannot fetch replies of a reply');
    }

    const { status, cursor, limit } = query;

    const where: Prisma.CommentWhereInput = { parentId };

    if (status !== undefined) {
      where.status = status;
    }

    const [totalCount, replies] = await Promise.all([
      this.prisma.comment.count({ where }),
      this.prisma.comment.findMany({
        where,
        take: limit + 1, // to check if next page exists
        ...(cursor && { cursor: { id: cursor }, skip: 1 }),
        orderBy: { id: 'asc' }, // old replies first
        select: {
          id: true,
          content: true,
          status: true,
          postId: true,
          // parentId: true,
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

    const nextCursor = hasNextPage ? replies[replies.length - 1]?.id : null;

    return {
      meta: {
        totalCount,
        limit,
        cursor: cursor ?? null,
        nextCursor,
        hasNextPage,
      },
      list: replies,
    };
  }

  async updateCommentStatus(id: number, status: CommentStatus) {
    const comment = await this.prisma.comment.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    await this.prisma.comment.update({
      where: { id },
      data: { status },
    });

    return { message: 'Comment status updated successfully' };
  }
}
