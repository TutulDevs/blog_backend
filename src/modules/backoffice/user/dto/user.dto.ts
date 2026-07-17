import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsIn, IsNumber, IsOptional, IsString } from 'class-validator';
import { Transform } from 'class-transformer';
import {
  STATUS_ACTIVE,
  STATUS_INACTIVE,
  UserStatus,
} from '../../../../lib/coreconstants';
import { PaginationPageLimitDto } from '../../../../common/dto/pagination.dto';

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

export class UpdateUserStatusDto {
  @ApiProperty({ enum: UserStatus, example: UserStatus.ACTIVE })
  @IsEnum(UserStatus)
  status: UserStatus;
}

export class UpdateUserVerifiedDto {
  @ApiProperty({
    description: 'Verification status: 0 for false, 1 for true',
    enum: [STATUS_INACTIVE, STATUS_ACTIVE],
    example: STATUS_ACTIVE,
  })
  @IsNumber()
  @IsIn([STATUS_INACTIVE, STATUS_ACTIVE], {
    message: 'isVerified must be either 0 or 1',
  })
  isVerified: number;
}
