import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import {
  IsEnum,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { CategoryStatus } from '../../../../lib/coreconstants';
import { PaginationPageLimitDto } from '../../../../common/dto/pagination.dto';

export class CreateCategoryDto {
  @ApiProperty({ example: 'Technology' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ enum: CategoryStatus, example: CategoryStatus.ACTIVE })
  @IsOptional()
  @IsEnum(CategoryStatus, { message: 'Invalid status' })
  status?: CategoryStatus;
}

export class UpdateCategoryDto extends PartialType(CreateCategoryDto) {}

export class GetAllCategoriesQueryDto extends PaginationPageLimitDto {
  @ApiPropertyOptional({ example: 'tech' })
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

  @ApiPropertyOptional({ enum: CategoryStatus, example: CategoryStatus.ACTIVE })
  @IsOptional()
  @IsEnum(CategoryStatus, { message: 'Invalid status' })
  status?: CategoryStatus;

  @ApiPropertyOptional({
    example: 'createdAt',
    description: 'Field to sort by',
  })
  @IsOptional()
  @IsString()
  @IsIn(['createdAt', 'name'], { message: 'Invalid sortBy field' })
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
