import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import { Type } from 'class-transformer';
import { PostStatus } from '../../../../lib/coreconstants';
import { PaginationPageLimitDto } from 'src/common/dto/pagination.dto';

export class GetAllPostsQueryDto extends PaginationPageLimitDto {
  @ApiPropertyOptional({ example: 'nestjs' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ enum: PostStatus, example: PostStatus.PUBLISHED })
  @IsOptional()
  @IsEnum(PostStatus, { message: 'Invalid status' })
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

export class CreatePostDto {
  @ApiProperty({ example: 'How to write great blog posts' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ example: 'Full article content goes here...' })
  @IsString()
  @IsNotEmpty()
  content: string;

  @ApiPropertyOptional({
    example: 'how-to-write-great-blog-posts',
    description: 'URL slug. Auto-generated from the title if omitted.',
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  slug?: string;

  @ApiPropertyOptional({ example: '/uploads/covers/post-1.jpg' })
  @IsOptional()
  @IsString()
  coverImage?: string;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  categoryId?: number;
}

export class UpdatePostDto {
  @ApiPropertyOptional({ example: 'How to write great blog posts' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  title?: string;

  @ApiPropertyOptional({ example: 'Full article content goes here...' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  content?: string;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  categoryId?: number;

  @ApiPropertyOptional({
    description: 'Status (only archive)',
    example: PostStatus.ARCHIVED,
  })
  @IsOptional()
  @IsNumber()
  status?: number;
}

export class UpdatePostSlugDto {
  @ApiProperty({ example: 'how-to-write-great-blog-posts' })
  @IsString()
  @IsNotEmpty()
  slug: string;
}

export class UpdatePostCoverImageDto {
  @ApiProperty({ example: '/uploads/covers/post-1.jpg' })
  @IsString()
  @IsNotEmpty()
  coverImage: string;
}
