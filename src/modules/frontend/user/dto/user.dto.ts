import { ApiPropertyOptional, ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
  MinLength,
} from 'class-validator';
import { Type } from 'class-transformer';
import { PaginationPageLimitDto } from 'src/common/dto/pagination.dto';

export class UpdateMyProfileDto {
  @ApiPropertyOptional({ example: 'John Doe' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  name?: string;

  @ApiPropertyOptional({ example: 'johndoe' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  username?: string;

  @ApiPropertyOptional({ example: 'john@email.com' })
  @IsOptional()
  @IsEmail()
  email?: string;
}

export class UpdateMyPasswordDto {
  @ApiProperty({ example: 'Pass.1234' })
  @IsString()
  @IsNotEmpty()
  currentPassword: string;

  @ApiProperty({ example: 'NewPass.5678' })
  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  newPassword: string;
}

export class GetTopAuthorsQueryDto extends PaginationPageLimitDto {}

export class GetTrendingAuthorsQueryDto extends PaginationPageLimitDto {
  @ApiPropertyOptional({
    example: 30,
    description: 'Only count comments received within the last N days',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  days?: number = 30;
}
