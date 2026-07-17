import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsEnum,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import {
  STATUS_ACTIVE,
  STATUS_INACTIVE,
  UserStatus,
} from '../../../../lib/coreconstants';
import { PaginationPageLimitDto } from 'src/common/dto/pagination.dto';

export class GetAllUsersQueryDto extends PaginationPageLimitDto {
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

  @ApiPropertyOptional({ enum: UserStatus, example: UserStatus.ACTIVE })
  @IsOptional()
  @IsEnum(UserStatus, { message: 'Invalid status' })
  status?: UserStatus;

  @ApiPropertyOptional({
    description: 'Verification status: 0 for false, 1 for true',
    enum: [STATUS_INACTIVE, STATUS_ACTIVE],
    example: 1,
  })
  @IsOptional()
  @IsNumber()
  @IsIn([STATUS_INACTIVE, STATUS_ACTIVE], {
    message: 'Verification status must be either 0 or 1',
  })
  isVerified?: number;

  // based on user's post count
  @ApiPropertyOptional({
    description:
      'Minimum number of posts. 0 means no posts, 10 means >= 10 posts.',
    example: 10,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0, { message: 'minPosts must be 0 or a positive number' })
  minPosts?: number;

  // order by
  @ApiPropertyOptional({
    example: 'createdAt',
    description: 'Field to sort by',
  })
  @IsOptional()
  @IsString()
  @IsIn(['createdAt', 'name', 'username', 'email'], {
    message: 'Invalid sortBy field',
  })
  sortBy?: string = 'createdAt';

  @ApiPropertyOptional({
    example: 'desc',
    enum: ['asc', 'desc'],
    description: 'Sort direction',
  })
  @IsOptional()
  @IsString()
  @IsIn(['asc', 'desc'], { message: 'sortOrder must be either asc or desc' })
  sortOrder?: 'asc' | 'desc' = 'desc';
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
  @ApiProperty({ enum: UserStatus, example: UserStatus.ACTIVE })
  @IsEnum(UserStatus)
  status: UserStatus;
}

export class UpdateUserUsernameDto {
  @ApiProperty({ example: 'johndoe' })
  @IsString()
  @IsNotEmpty()
  username: string;
}
