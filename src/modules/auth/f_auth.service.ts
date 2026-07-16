import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../prisma/prisma.service';
import {
  STATUS_ACTIVE,
  UserStatus,
  DEFAULT_SALT_ROUNDS,
  STATUS_INACTIVE,
  USER_VERIFY_CODE_TTL_MINUTES,
} from '../../lib/coreconstants';
import { generateRandomNumber } from 'src/lib/functions';
import {
  UserLoginDto,
  UserRegisterDto,
  UserVerifyEmailDto,
} from './dto/auth_user.dto';

@Injectable()
export class F_AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async userRegister(dto: UserRegisterDto) {
    const existingUser = await this.prisma.user.findFirst({
      where: { OR: [{ email: dto.email }, { username: dto.username }] },
    });

    if (existingUser) {
      throw new ConflictException(
        'An account with this email or username already exists.',
      );
    }

    const hashedPassword = await bcrypt.hash(dto.password, DEFAULT_SALT_ROUNDS);
    const verifyCodeExpiresAt = new Date(
      Date.now() + USER_VERIFY_CODE_TTL_MINUTES * 60 * 1000,
    );

    const newUser = await this.prisma.user.create({
      data: {
        username: dto.username,
        email: dto.email,
        name: dto.name,
        password: hashedPassword,
        status: UserStatus.PENDING_VERIFICATION,
        isVerified: STATUS_INACTIVE,
        verifyCode: generateRandomNumber(),
        verifyCodeExpiresAt,
      },
    });

    return {
      id: newUser.id,
      username: newUser.username,
      email: newUser.email,
    };
  }

  async userVerifyEmail(dto: UserVerifyEmailDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    const isCodeValid =
      user?.verifyCode != null && user.verifyCode === Number(dto.verifyCode);
    const isCodeExpired =
      !user?.verifyCodeExpiresAt || user.verifyCodeExpiresAt < new Date();

    if (!user || !isCodeValid || isCodeExpired) {
      throw new BadRequestException('Invalid or expired verification code');
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        status: UserStatus.ACTIVE,
        isVerified: STATUS_ACTIVE,
        verifyCode: null,
        verifyCodeExpiresAt: null,
      },
    });

    return {
      message: 'Email verified successfully',
    };
  }

  async userLogin(dto: UserLoginDto) {
    const user = await this.prisma.user.findFirst({
      where: {
        OR: [{ email: dto.identifier }, { username: dto.identifier }],
      },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid email/username or password');
    }

    const passwordMatches = await bcrypt.compare(dto.password, user.password);
    if (!passwordMatches) {
      throw new UnauthorizedException('Invalid email/username or password');
    }

    if (user.isVerified !== STATUS_ACTIVE) {
      throw new UnauthorizedException('User is not verified');
    }

    if (user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedException('User account is not active');
    }

    const payload = {
      id: user.id,
      username: user.username,
      status: user.status,
    };

    const accessToken = await this.jwtService.signAsync(payload);

    return {
      accessToken,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        name: user.name,
        status: user.status,
      },
    };
  }
}
