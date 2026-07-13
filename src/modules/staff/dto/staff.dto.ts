import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { StaffRole, StaffStatus } from '../../../lib/coreconstants';

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
