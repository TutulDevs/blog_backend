import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
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
