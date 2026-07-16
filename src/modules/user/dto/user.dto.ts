import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { AuthorStatus } from '../../../lib/coreconstants';

export class GetAllUsersQueryDto {
  @ApiPropertyOptional({ example: 'john' })
  @IsOptional()
  @IsString()
  @Transform(({ value }) => {
    return typeof value !== 'string'
      ? value
      : value.trim() === ''
        ? undefined
        : value.trim().toLowerCase();
  })
  search?: string;

  @ApiPropertyOptional({ enum: AuthorStatus, example: AuthorStatus.ACTIVE })
  @IsOptional()
  @IsEnum(AuthorStatus, { message: 'Invalid status' })
  status?: AuthorStatus;

  // is verified

  // has 0 posts, based on post count

  // order by

  // Pagination
  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  page: number = 1;

  @ApiPropertyOptional({ example: 10 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  limit: number = 10;
}

export class UpdateUserDto {
  // username, name, status

  @ApiPropertyOptional({ example: 'John Doe' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ example: 'john@email.com' })
  @IsOptional()
  @IsEmail()
  email?: string;
}

export class UpdateUserStatusDto {
  @ApiProperty({ enum: AuthorStatus, example: AuthorStatus.ACTIVE })
  @IsEnum(AuthorStatus)
  status: AuthorStatus;
}

export class UpdateUserUsernameDto {
  @ApiProperty({ example: 'johndoe' })
  @IsString()
  @IsNotEmpty()
  username: string;
}
