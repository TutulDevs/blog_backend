import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { F_AuthService } from './f_auth.service';
import {
  UserLoginDto,
  UserRegisterDto,
  UserVerifyEmailDto,
} from './dto/auth_user.dto';

@ApiTags('auth user')
@Controller('auth')
export class F_AuthController {
  constructor(private readonly authService: F_AuthService) {}

  @Post('user/register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Register a new User (blog author)',
  })
  @ApiResponse({
    status: 201,
    description: 'Register successful, returns user profile',
  })
  @ApiResponse({
    status: 409,
    description: 'A user with this email or username already exists',
  })
  userRegister(@Body() dto: UserRegisterDto) {
    return this.authService.userRegister(dto);
  }

  @Post('user/verify_email')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Verify a User email address with the verification code',
  })
  @ApiResponse({
    status: 200,
    description: 'Email verified successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid or expired verification code',
  })
  userVerifyEmail(@Body() dto: UserVerifyEmailDto) {
    return this.authService.userVerifyEmail(dto);
  }

  @Post('user/login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      'Log in as User (blog author) with email or username, and receive a JWT access token',
  })
  @ApiResponse({
    status: 200,
    description: 'Login successful, returns access token and user profile',
  })
  @ApiResponse({
    status: 401,
    description: 'Invalid credentials, unverified email, or inactive account',
  })
  userLogin(@Body() dto: UserLoginDto) {
    return this.authService.userLogin(dto);
  }
}
