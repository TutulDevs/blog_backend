import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { UserStatus } from '../../../lib/coreconstants';
import { GetAllUsersQueryDto } from './dto/user.dto';

const USER_OMIT = {
  password: true,
  verifyCode: true,
  verifyCodeExpiresAt: true,
} as Prisma.UserOmit;

@Injectable()
export class B_UserService {
  constructor(private readonly prisma: PrismaService) {}

  async getAllUsers(query: GetAllUsersQueryDto) {
    const { search, status, isVerified, sortBy, sortOrder, page, limit } =
      query;

    const where: Prisma.UserWhereInput = {};

    if (status !== undefined) {
      where.status = status;
    }

    if (isVerified !== undefined) {
      where.isVerified = isVerified;
    }

    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { username: { contains: search, mode: 'insensitive' } },
        { name: { contains: search, mode: 'insensitive' } },
      ];
    }

    const skip = (page - 1) * limit;
    const take = limit;

    const [totalFilteredUsers, users] = await Promise.all([
      this.prisma.user.count({ where }),
      this.prisma.user.findMany({
        where,
        skip,
        take,
        orderBy: !sortBy ? { createdAt: 'desc' } : { [sortBy]: sortOrder },
        omit: USER_OMIT,
        include: { _count: { select: { posts: true } } },
      }),
    ]);

    return {
      meta: {
        totalCount: totalFilteredUsers,
        page,
        limit,
        totalPages: Math.ceil(totalFilteredUsers / limit),
      },
      list: users,
    };
  }

  async getUserByUsername(username: string) {
    const user = await this.prisma.user.findUnique({
      where: { username },
      omit: USER_OMIT,
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return { user };
  }

  async updateUserStatus(username: string, status: UserStatus) {
    await this.getUserByUsername(username);

    const user = await this.prisma.user.update({
      where: { username },
      data: { status },
      omit: USER_OMIT,
    });

    return { user };
  }

  async updateUserVerified(username: string, isVerified: number) {
    await this.getUserByUsername(username);

    const user = await this.prisma.user.update({
      where: { username },
      data: { isVerified },
      omit: USER_OMIT,
    });

    return { user };
  }

  async deleteUser(username: string) {
    await this.getUserByUsername(username);

    await this.prisma.user.delete({ where: { username } });

    return { message: 'User deleted successfully' };
  }
}
