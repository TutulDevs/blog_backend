import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../../prisma/prisma.service';
import {
  DEFAULT_SALT_ROUNDS,
  PostStatus,
  UserStatus,
} from '../../../lib/coreconstants';
import {
  GetTopAuthorsQueryDto,
  GetTrendingAuthorsQueryDto,
  UpdateMyPasswordDto,
  UpdateMyProfileDto,
} from './dto/user.dto';

const USER_OMIT = {
  password: true,
  verifyCode: true,
  verifyCodeExpiresAt: true,
} as Prisma.UserOmit;

@Injectable()
export class F_UserService {
  constructor(private readonly prisma: PrismaService) {}

  async getMyProfile(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      omit: USER_OMIT,
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return { user };
  }

  async updateMyProfile(userId: number, dto: UpdateMyProfileDto) {
    try {
      const user = await this.prisma.user.update({
        where: { id: userId },
        data: dto,
        omit: USER_OMIT,
      });

      return { user };
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException('Username or email already in use');
      }
      throw error;
    }
  }

  async updateMyPassword(userId: number, dto: UpdateMyPasswordDto) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const passwordMatches = await bcrypt.compare(
      dto.currentPassword,
      user.password,
    );

    if (!passwordMatches) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    const hashedPassword = await bcrypt.hash(
      dto.newPassword,
      DEFAULT_SALT_ROUNDS,
    );

    await this.prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    return { message: 'Password updated successfully' };
  }

  async deactivateMyAccount(userId: number) {
    await this.prisma.user.update({
      where: { id: userId },
      data: { status: UserStatus.INACTIVE },
    });

    return { message: 'Account deactivated successfully' };
  }

  async getPublicProfileByUsername(username: string) {
    const user = await this.prisma.user.findUnique({
      where: { username },
      select: {
        username: true,
        name: true,
        createdAt: true,
        posts: {
          where: { status: PostStatus.PUBLISHED },
          select: {
            id: true,
            title: true,
            slug: true,
            coverImage: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return { user };
  }

  // REMINDER: this method is very slow for thousands of data
  async getTopAuthors(query: GetTopAuthorsQueryDto) {
    const { page, limit } = query;
    const skip = (page - 1) * limit;

    const grouped = await this.prisma.post.groupBy({
      by: ['userId'],
      where: { status: PostStatus.PUBLISHED },
      _count: { userId: true },
      orderBy: { _count: { userId: 'desc' } },
    });

    const totalCount = grouped.length;
    const pageSlice = grouped.slice(skip, skip + limit);

    const users = await this.prisma.user.findMany({
      where: { id: { in: pageSlice.map((g) => g.userId) } },
      select: { id: true, username: true, name: true },
    });
    const userById = new Map(users.map((u) => [u.id, u]));

    const list = pageSlice.map((g) => ({
      ...userById.get(g.userId),
      publishedPostCount: g._count.userId,
    }));

    return {
      meta: {
        totalCount,
        page,
        limit,
        totalPages: Math.ceil(totalCount / limit),
      },
      list,
    };
  }

  // REMINDER: this method is very slow for thousands of data
  async getTrendingAuthors(query: GetTrendingAuthorsQueryDto) {
    const { page, limit, days } = query;
    const since = new Date(Date.now() - (days ?? 30) * 24 * 60 * 60 * 1000);

    const comments = await this.prisma.comment.findMany({
      where: {
        createdAt: { gte: since },
        post: { status: PostStatus.PUBLISHED },
      },
      select: { post: { select: { userId: true } } },
    });

    const commentCountByUserId = new Map<number, number>();
    for (const comment of comments) {
      const userId = comment.post.userId;
      commentCountByUserId.set(
        userId,
        (commentCountByUserId.get(userId) ?? 0) + 1,
      );
    }

    const sorted = [...commentCountByUserId.entries()].sort(
      (a, b) => b[1] - a[1],
    );

    const totalCount = sorted.length;
    const skip = (page - 1) * limit;
    const pageSlice = sorted.slice(skip, skip + limit);

    const users = await this.prisma.user.findMany({
      where: { id: { in: pageSlice.map(([userId]) => userId) } },
      select: { id: true, username: true, name: true },
    });
    const userById = new Map(users.map((u) => [u.id, u]));

    const list = pageSlice.map(([userId, commentCount]) => ({
      ...userById.get(userId),
      commentCount,
    }));

    return {
      meta: {
        totalCount,
        page,
        limit,
        totalPages: Math.ceil(totalCount / limit),
      },
      list,
    };
  }
}
