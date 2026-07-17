import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { StaffRole, StaffStatus } from '../../../lib/coreconstants';
import { Transform } from 'class-transformer';

export class UpdateStaffStatusDto {
  @ApiProperty({ enum: StaffStatus, example: StaffStatus.ACTIVE })
  @IsEnum(StaffStatus)
  status: StaffStatus;
}

export class UpdateStaffRoleDto {
  @ApiProperty({ enum: StaffRole, example: StaffRole.EDITOR })
  @IsEnum(StaffRole)
  role: StaffRole;
}

export class GetAllStaffsQueryDto {
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

  @ApiPropertyOptional({ enum: StaffStatus, example: StaffStatus.ACTIVE })
  @IsOptional()
  @IsEnum(StaffStatus, { message: 'Invalid status' })
  status?: StaffStatus;

  @ApiPropertyOptional({ enum: StaffRole, example: StaffRole.ADMIN })
  @IsOptional()
  @IsEnum(StaffRole, { message: 'Invalid role' })
  role?: StaffRole;

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
