import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class StaffService {
  constructor(private readonly prisma: PrismaService) {}

  async getAllStaffs() {
    const staffs = await this.prisma.staff.findMany({
      select: { id: true, email: true, name: true, role: true },
    });

    return {
      totalCount: staffs.length,
      list: staffs,
    };
  }

  async getStaffById(id: number) {
    const staff = await this.prisma.staff.findUnique({
      where: { id },
      omit: { password: true, resetCode: true },
    });

    if (!staff) {
      throw new NotFoundException('Staff not found');
    }

    return {
      staff,
    };
  }
}
