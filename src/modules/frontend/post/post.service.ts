import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { PostStatus } from '../../../lib/coreconstants';
import { slugify } from '../../../lib/functions';
import {
  CreatePostDto,
  GetAllPostsQueryDto,
  UpdatePostDto,
} from './dto/post.dto';
import {
  AuthenticatedUser,
  isStaffUser,
} from 'src/common/guards/auth-payload.types';

const POST_INCLUDE = {
  user: {
    select: { username: true, name: true },
  },
  category: {
    select: { id: true, name: true },
  },
} as Prisma.PostInclude;

@Injectable()
export class PostService {
  constructor(private readonly prisma: PrismaService) {}

  private assertOwnerOrStaff(
    post: { userId: number },
    authUser: AuthenticatedUser,
  ) {
    if (isStaffUser(authUser)) return;

    if (post.userId !== authUser.id) {
      throw new ForbiddenException(
        'You do not have permission to modify this post',
      );
    }
  }

  private async findPostByIdOrThrow(id: number) {
    const post = await this.prisma.post.findUnique({ where: { id } });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    return post;
  }

  async getAllPosts(query: GetAllPostsQueryDto, reqUser?: AuthenticatedUser) {
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

    const isOwnPostsFilter =
      reqUser && userId !== undefined && userId === reqUser.id;

    if (isOwnPostsFilter) {
      if (status !== undefined) {
        where.status = status;
      }
    } else {
      where.status = PostStatus.PUBLISHED;
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

  async getMyPosts(query: GetAllPostsQueryDto, userId: number) {
    const { search, status, categoryId, sortBy, sortOrder, page, limit } =
      query;

    const where: Prisma.PostWhereInput = { userId };

    if (status !== undefined) {
      where.status = status;
    }

    if (categoryId !== undefined) {
      where.categoryId = categoryId;
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

  async getPostBySlug(slug: string, reqUser?: AuthenticatedUser) {
    const post = await this.prisma.post.findUnique({
      where: { slug },
      include: POST_INCLUDE,
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    const isOwner = reqUser !== undefined && reqUser.id === post.userId;

    if (post.status !== PostStatus.PUBLISHED && !isOwner) {
      throw new NotFoundException('Post not found');
    }

    return { post };
  }

  async createPost(userId: number, dto: CreatePostDto) {
    const slug = slugify(dto.slug ?? dto.title);

    try {
      const post = await this.prisma.post.create({
        data: {
          title: dto.title,
          content: dto.content,
          slug,
          coverImage: dto.coverImage,
          categoryId: dto.categoryId,
          userId,
          status: PostStatus.DRAFT,
        },
        include: POST_INCLUDE,
      });

      return { message: 'Post created successfully', post };
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new ConflictException('Slug already in use');
        }
        if (error.code === 'P2003') {
          throw new BadRequestException('Invalid category reference');
        }
      }
      throw error;
    }
  }

  async updatePost(
    id: number,
    dto: UpdatePostDto,
    authUser: AuthenticatedUser,
  ) {
    const post = await this.findPostByIdOrThrow(id);
    this.assertOwnerOrStaff(post, authUser);

    if (dto.status !== undefined && dto.status !== PostStatus.ARCHIVED) {
      throw new BadRequestException('Invalid status');
    }

    try {
      const updated = await this.prisma.post.update({
        where: { id },
        data: dto,
        include: POST_INCLUDE,
      });

      return { message: 'Post updated successfully', post: updated };
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2003'
      ) {
        throw new BadRequestException('Invalid category reference');
      }
      throw error;
    }
  }

  async updatePostSlug(id: number, slug: string, authUser: AuthenticatedUser) {
    const post = await this.findPostByIdOrThrow(id);
    this.assertOwnerOrStaff(post, authUser);

    try {
      const updated = await this.prisma.post.update({
        where: { id },
        data: { slug: slugify(slug) },
        include: POST_INCLUDE,
      });

      return { message: 'Slug updated successfully', post: updated };
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException('Slug already in use');
      }
      throw error;
    }
  }

  async updatePostCoverImage(
    id: number,
    coverImage: string,
    authUser: AuthenticatedUser,
  ) {
    const post = await this.findPostByIdOrThrow(id);
    this.assertOwnerOrStaff(post, authUser);

    const updated = await this.prisma.post.update({
      where: { id },
      data: { coverImage },
      include: POST_INCLUDE,
    });

    return { message: 'Cover image updated successfully', post: updated };
  }

  async deletePost(id: number, authUser: AuthenticatedUser) {
    const post = await this.findPostByIdOrThrow(id);
    this.assertOwnerOrStaff(post, authUser);

    await this.prisma.post.delete({ where: { id } });

    return { message: 'Post deleted successfully' };
  }
}
