import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  MinLength,
} from 'class-validator';

export class StaffLoginDto {
  @ApiProperty({ example: 'admin@email.com' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ example: 'password123' })
  @IsString()
  @IsNotEmpty()
  password: string;
}

export class StaffRegisterDto {
  @ApiProperty({ example: 'admin@email.com' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ example: 'password123' })
  @IsString()
  @IsNotEmpty()
  password: string;

  @ApiProperty({ example: 'John Doe' })
  @IsString()
  @IsOptional()
  name: string;

  @ApiProperty({ example: 1 })
  @IsNumber()
  @IsOptional()
  role: number;

  @ApiProperty({ example: 1 })
  @IsNumber()
  @IsOptional()
  status: number;
}

export class StaffForgotPasswordDto {
  @ApiProperty({ example: 'admin@email.com' })
  @IsEmail()
  @IsNotEmpty()
  email: string;
}

export class StaffResetPasswordDto {
  @ApiProperty({ example: 'admin@email.com' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ example: 'password123' })
  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  password: string;

  @ApiProperty({ example: '123789' })
  @IsString()
  @IsNotEmpty()
  @Matches(/^\d{6}$/, { message: 'resetCode must be a 6-digit code' })
  resetCode: string;
}
