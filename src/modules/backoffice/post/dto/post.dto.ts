import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsInt, IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';
import { PostStatus } from '../../../../lib/coreconstants';
import { PaginationPageLimitDto } from '../../../../common/dto/pagination.dto';
import { IsEnumValue } from '../../../../common/decorators/is_enum_value.decorator';

export class GetAllPostsQueryDto extends PaginationPageLimitDto {
  @ApiPropertyOptional({ example: 'nestjs' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ enum: PostStatus, example: PostStatus.PUBLISHED })
  @IsOptional()
  @IsEnumValue(PostStatus)
  status?: PostStatus;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  categoryId?: number;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  userId?: number;

  @ApiPropertyOptional({
    example: 'createdAt',
    description: 'Field to sort by',
  })
  @IsOptional()
  @IsString()
  @IsIn(['createdAt', 'title'], { message: 'Invalid sortBy field' })
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

export class UpdatePostStatusDto {
  @ApiProperty({ enum: PostStatus, example: PostStatus.PUBLISHED })
  @IsEnumValue(PostStatus)
  status: PostStatus;
}
