import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { PostStatus } from '../../../lib/coreconstants';
import { GetAllPostsQueryDto } from './dto/post.dto';

const POST_INCLUDE = {
  user: {
    select: { username: true, name: true },
  },
  category: {
    select: { id: true, name: true },
  },
} as Prisma.PostInclude;

@Injectable()
export class B_PostService {
  constructor(private readonly prisma: PrismaService) {}

  private async findPostByIdOrThrow(id: number) {
    const post = await this.prisma.post.findUnique({ where: { id } });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    return post;
  }

  async getAllPosts(query: GetAllPostsQueryDto) {
    const {
      search,
      status,
      categoryId,
      userId,
      sortBy,
      sortOrder,
      page,
      limit,
    } = query;

    const where: Prisma.PostWhereInput = {};

    if (status !== undefined) {
      where.status = status;
    }

    if (categoryId !== undefined) {
      where.categoryId = categoryId;
    }

    if (userId !== undefined) {
      where.userId = userId;
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { slug: { contains: search, mode: 'insensitive' } },
        { content: { contains: search, mode: 'insensitive' } },
      ];
    }

    const skip = (page - 1) * limit;
    const take = limit;

    const [totalFilteredPosts, posts] = await Promise.all([
      this.prisma.post.count({ where }),
      this.prisma.post.findMany({
        where,
        skip,
        take,
        orderBy: !sortBy ? { createdAt: 'desc' } : { [sortBy]: sortOrder },
        include: POST_INCLUDE,
      }),
    ]);

    return {
      meta: {
        totalCount: totalFilteredPosts,
        page,
        limit,
        totalPages: Math.ceil(totalFilteredPosts / limit),
      },
      list: posts,
    };
  }

  async getPostBySlug(slug: string) {
    const post = await this.prisma.post.findUnique({
      where: { slug },
      include: POST_INCLUDE,
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    return { post };
  }

  async updatePostStatus(id: number, status: PostStatus) {
    await this.findPostByIdOrThrow(id);

    const post = await this.prisma.post.update({
      where: { id },
      data: { status },
      include: POST_INCLUDE,
    });

    return { post };
  }

  async deletePost(id: number) {
    await this.findPostByIdOrThrow(id);

    await this.prisma.post.delete({ where: { id } });

    return { message: 'Post deleted successfully' };
  }
}
