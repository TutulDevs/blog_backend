import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { StaffLoginDto, StaffRegisterDto } from './dto/staff.dto';

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
}
