import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { AuthorStatus } from '../../lib/coreconstants';
import { GetAllUsersQueryDto, UpdateUserDto } from './dto/user.dto';

const USER_OMIT = {
  password: true,
  verifyCode: true,
  verifyCodeExpiresAt: true,
} as Prisma.UserOmit;

@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) {}

  async getAllUsers(query: GetAllUsersQueryDto) {
    const { search, status, limit, page } = query;

    const where: Prisma.UserWhereInput = {};

    if (status !== undefined) {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { username: { contains: search, mode: 'insensitive' } },
        { name: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Pagination
    const skip = (page - 1) * limit;
    const take = limit;

    const [totalFilteredUsers, users] = await Promise.all([
      this.prisma.user.count({ where }),
      this.prisma.user.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        omit: USER_OMIT,
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

  async getUserByIdOrUsername(id_or_username: string) {
    const parsedId = Number(id_or_username);
    const idValue = isNaN(parsedId) ? -1 : parsedId;

    const user = await this.prisma.user.findFirst({
      where: {
        OR: [{ id: idValue }, { username: id_or_username }],
      },
      omit: USER_OMIT,
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return {
      user,
    };
  }

  async getUserById(id: number) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      omit: USER_OMIT,
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return {
      user,
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

    return {
      user,
    };
  }

  async updateUser(id: number, dto: UpdateUserDto) {
    await this.getUserById(id);

    if (dto.email) {
      const existingUser = await this.prisma.user.findUnique({
        where: { email: dto.email },
      });

      if (existingUser && existingUser.id !== id) {
        throw new ConflictException('Email already in use');
      }
    }

    const user = await this.prisma.user.update({
      where: { id },
      data: dto,
      omit: USER_OMIT,
    });

    return {
      user,
    };
  }

  async updateUserStatus(id: number, status: AuthorStatus) {
    await this.getUserById(id);

    const user = await this.prisma.user.update({
      where: { id },
      data: { status },
      omit: USER_OMIT,
    });

    return {
      user,
    };
  }

  async updateUserUsername(id: number, username: string) {
    await this.getUserById(id);

    const existingUser = await this.prisma.user.findUnique({
      where: { username },
    });

    if (existingUser && existingUser.id !== id) {
      throw new ConflictException('Username already in use');
    }

    const user = await this.prisma.user.update({
      where: { id },
      data: { username },
      omit: USER_OMIT,
    });

    return {
      user,
    };
  }
}
