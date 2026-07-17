import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { StaffRole, StaffStatus } from '../../lib/coreconstants';
import { GetAllStaffsQueryDto } from './dto/staff.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class StaffService {
  constructor(private readonly prisma: PrismaService) {}

  async getAllStaffs(
    staffRole: StaffRole | undefined,
    query: GetAllStaffsQueryDto,
  ) {
    const isAdmin = staffRole === StaffRole.ADMIN;

    const { search, status, role, limit, page } = query;

    const where: Prisma.StaffWhereInput = {};

    if (status !== undefined) {
      where.status = status;
    }

    if (role !== undefined) {
      where.role = role;
    }

    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { name: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Pagination
    const skip = (page - 1) * limit;
    const take = limit;

    const [totalFilteredStaffs, staffs] = await Promise.all([
      this.prisma.staff.count({ where }),
      this.prisma.staff.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        omit: {
          password: true,
          resetCode: true,
          resetCodeExpiresAt: true,
          status: !isAdmin,
        } as Prisma.StaffOmit,
      }),
    ]);

    return {
      meta: {
        totalCount: totalFilteredStaffs,
        page,
        limit,
        totalPages: Math.ceil(totalFilteredStaffs / limit),
      },
      list: staffs,
    };
  }

  async getStaffById(id: number) {
    const staff = await this.prisma.staff.findUnique({
      where: { id },
      omit: { password: true, resetCode: true, resetCodeExpiresAt: true },
    });

    if (!staff) {
      throw new NotFoundException('Staff not found');
    }

    return {
      staff,
    };
  }

  async updateStaffStatus(id: number, status: StaffStatus) {
    await this.getStaffById(id);

    const staff = await this.prisma.staff.update({
      where: { id },
      data: { status },
      omit: { password: true, resetCode: true, resetCodeExpiresAt: true },
    });

    return {
      staff,
    };
  }

  async updateStaffRole(id: number, role: StaffRole) {
    await this.getStaffById(id);

    const staff = await this.prisma.staff.update({
      where: { id },
      data: { role },
      omit: { password: true, resetCode: true, resetCodeExpiresAt: true },
    });

    return {
      staff,
    };
  }
}
