import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../../prisma/prisma.service';
import {
  DEFAULT_SALT_ROUNDS,
  STAFF_RESET_CODE_TTL_MINUTES,
  StaffStatus,
} from '../../../lib/coreconstants';
import {
  StaffForgotPasswordDto,
  StaffLoginDto,
  StaffRegisterDto,
  StaffResetPasswordDto,
} from './dto/auth_staff.dto';
import { generateRandomNumber } from 'src/lib/functions';

@Injectable()
export class B_AuthService {
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

    const hashedPassword = await bcrypt.hash(dto.password, DEFAULT_SALT_ROUNDS);

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

  async staffForgotPassword(dto: StaffForgotPasswordDto) {
    const staff = await this.prisma.staff.findUnique({
      where: { email: dto.email },
    });

    // Always return the same response whether or not the email exists,
    // so this endpoint can't be used to enumerate staff accounts.
    if (staff) {
      const resetCodeExpiresAt = new Date(
        Date.now() + STAFF_RESET_CODE_TTL_MINUTES * 60 * 1000,
      );

      await this.prisma.staff.update({
        where: { email: dto.email },
        data: { resetCode: generateRandomNumber(), resetCodeExpiresAt },
      });
    }

    return {
      message: 'If that email is registered, a reset code has been sent',
    };
  }

  async staffResetPassword(dto: StaffResetPasswordDto) {
    const staff = await this.prisma.staff.findUnique({
      where: { email: dto.email },
    });

    const isCodeValid =
      staff?.resetCode != null && staff.resetCode === Number(dto.resetCode);
    const isCodeExpired =
      !staff?.resetCodeExpiresAt || staff.resetCodeExpiresAt < new Date();

    if (!staff || !isCodeValid || isCodeExpired) {
      throw new BadRequestException('Invalid or expired reset code');
    }

    const hashedPassword = await bcrypt.hash(dto.password, DEFAULT_SALT_ROUNDS);

    await this.prisma.staff.update({
      where: { id: staff.id },
      data: {
        resetCode: null,
        resetCodeExpiresAt: null,
        password: hashedPassword,
      },
    });

    return {
      message: 'Reset password successful',
    };
  }
}
