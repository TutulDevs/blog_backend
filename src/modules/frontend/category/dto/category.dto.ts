import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';
import { CategoryStatus } from '../../../../lib/coreconstants';
import { PaginationPageLimitDto } from 'src/common/dto/pagination.dto';
import { Transform } from 'class-transformer';

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

export class UpdateCategoryDto {
  @ApiPropertyOptional({ example: 'Technology' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  name?: string;

  @ApiPropertyOptional({ enum: CategoryStatus, example: CategoryStatus.ACTIVE })
  @IsOptional()
  @IsEnum(CategoryStatus, { message: 'Invalid status' })
  status?: CategoryStatus;
}

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
