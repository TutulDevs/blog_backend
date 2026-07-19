import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { StaffRole, StaffStatus } from '../../../../lib/coreconstants';
import { Transform } from 'class-transformer';
import { IsEnumValue } from '../../../../common/decorators/is_enum_value.decorator';

export class UpdateStaffStatusDto {
  @ApiProperty({ enum: StaffStatus, example: StaffStatus.ACTIVE })
  @IsEnumValue(StaffStatus)
  status: StaffStatus;
}

export class UpdateStaffRoleDto {
  @ApiProperty({ enum: StaffRole, example: StaffRole.EDITOR })
  @IsEnumValue(StaffRole)
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
  @IsEnumValue(StaffStatus)
  status?: StaffStatus;

  @ApiPropertyOptional({ enum: StaffRole, example: StaffRole.ADMIN })
  @IsOptional()
  @IsEnumValue(StaffRole)
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
