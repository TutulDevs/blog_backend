import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import {
  StaffForgotPasswordDto,
  StaffLoginDto,
  StaffRegisterDto,
  StaffResetPasswordDto,
} from './dto/auth_staff.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('staff/login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Log in as Staff (Admin/Editor) and receive a JWT access token',
  })
  @ApiResponse({
    status: 200,
    description: 'Login successful, returns access token and staff profile',
  })
  @ApiResponse({
    status: 401,
    description: 'Invalid credentials or inactive account',
  })
  staffLogin(@Body() dto: StaffLoginDto) {
    return this.authService.staffLogin(dto);
  }

  @Post('staff/register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Register staff',
  })
  @ApiResponse({
    status: 201,
    description: 'Register successful, returns staff profile',
  })
  @ApiResponse({
    status: 409,
    description: 'A staff with the credential exists',
  })
  staffRegister(@Body() dto: StaffRegisterDto) {
    return this.authService.staffRegister(dto);
  }

  @Post('staff/forgot_password')
  @Throttle({ default: { limit: 3, ttl: 15 * 60_000 } })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get reset code if password is forgotten',
  })
  @ApiResponse({
    status: 200,
    description:
      'Request accepted; a reset code is sent to the email if it is registered',
  })
  staffForgotPassword(@Body() dto: StaffForgotPasswordDto) {
    return this.authService.staffForgotPassword(dto);
  }

  @Post('staff/reset_password')
  @Throttle({ default: { limit: 5, ttl: 15 * 60_000 } })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Reset password with reset code',
  })
  @ApiResponse({
    status: 200,
    description: 'Reset password successful',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid or expired reset code',
  })
  staffResetPassword(@Body() dto: StaffResetPasswordDto) {
    return this.authService.staffResetPassword(dto);
  }
}
