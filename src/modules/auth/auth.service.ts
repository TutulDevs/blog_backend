import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../prisma/prisma.service';
import { StaffStatus } from '../../lib/coreconstants';
import { StaffLoginDto, StaffRegisterDto } from './dto/auth_staff.dto';

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
      id: staff.id,
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

  async staffRegister(dto: StaffRegisterDto) {
    const existingStaff = await this.prisma.staff.findUnique({
      where: { email: dto.email },
    });

    if (existingStaff) {
      throw new ConflictException(
        'An account with this email address already exists.',
      );
    }

    const hashedPassword = await bcrypt.hash(dto.password, 12);

    const newStaff = await this.prisma.staff.create({
      data: {
        ...dto,
        password: hashedPassword,
      },
    });

    return {
      id: newStaff.id,
      email: newStaff.email,
    };
  }
}
