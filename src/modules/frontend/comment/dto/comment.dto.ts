import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsEnum,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';
import { Type } from 'class-transformer';
import { CommentStatus } from '../../../../lib/coreconstants';
import { PaginationPageLimitDto } from 'src/common/dto/pagination.dto';

export class CreateCommentDto {
  @ApiProperty({ example: 1 })
  @Type(() => Number)
  @IsInt()
  postId: number;

  @ApiProperty({ example: 'Great article, thanks for sharing!' })
  @IsString()
  @IsNotEmpty()
  content: string;

  @ApiPropertyOptional({
    example: 'Jane Doe',
    description: 'Required for guest (not logged in) comments',
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  guestName?: string;

  @ApiPropertyOptional({
    example: 'jane@email.com',
    description: 'Required for guest (not logged in) comments',
  })
  @IsOptional()
  @IsEmail()
  guestEmail?: string;
}

export class UpdateCommentDto {
  @ApiProperty({ example: 'Edited: great article, thanks for sharing!' })
  @IsString()
  @IsNotEmpty()
  content: string;
}

export class UpdateCommentStatusDto {
  @ApiProperty({ enum: CommentStatus, example: CommentStatus.APPROVED })
  @IsEnum(CommentStatus)
  status: CommentStatus;
}

export class GetAllCommentsQueryDto extends PaginationPageLimitDto {
  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  postId?: number;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  userId?: number;

  @ApiPropertyOptional({ enum: CommentStatus, example: CommentStatus.APPROVED })
  @IsOptional()
  @IsEnum(CommentStatus, { message: 'Invalid status' })
  status?: CommentStatus;

  @ApiPropertyOptional({
    example: 'createdAt',
    description: 'Field to sort by',
  })
  @IsOptional()
  @IsString()
  @IsIn(['createdAt'], { message: 'Invalid sortBy field' })
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
