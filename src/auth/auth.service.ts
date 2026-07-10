import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { StaffStatus } from '../lib/coreconstants';
import { StaffLoginDto } from './dto/staff-login.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async staffLogin(dto: StaffLoginDto) {
    const staff = await this.prisma.staff.findUnique({
      where: { email: dto.email },
    });

    if (!staff) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const passwordMatches = await bcrypt.compare(dto.password, staff.password);
    if (!passwordMatches) {
      throw new UnauthorizedException('Invalid email or password');
    }

    if (staff.status !== StaffStatus.ACTIVE) {
      throw new UnauthorizedException('Staff account is not active');
    }

    const payload = {
      sub: staff.id,
      email: staff.email,
      role: staff.role,
    };

    const accessToken = await this.jwtService.signAsync(payload);

    return {
      accessToken,
      staff: {
        id: staff.id,
        email: staff.email,
        name: staff.name,
        role: staff.role,
        status: staff.status,
      },
    };
  }
}
