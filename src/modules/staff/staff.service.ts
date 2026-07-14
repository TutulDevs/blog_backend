import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { StaffRole, StaffStatus } from '../../lib/coreconstants';

@Injectable()
export class StaffService {
  constructor(private readonly prisma: PrismaService) {}

  async getAllStaffs(requesterRole: StaffRole) {
    const isAdmin = requesterRole === StaffRole.ADMIN;

    const totalStaffs = await this.prisma.staff.count();
    const staffs = await this.prisma.staff.findMany({
      omit: {
        password: true,
        resetCode: true,
        resetCodeExpiresAt: true,
        status: !isAdmin,
      },
    });

    return {
      totalCount: totalStaffs,
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
