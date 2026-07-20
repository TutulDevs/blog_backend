import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { CommentStatus } from '../../../../lib/coreconstants';
import { IsEnumValue } from '../../../../common/decorators/is_enum_value.decorator';

export class GetAllCommentsQueryDto {
  @ApiProperty({ example: 1, description: 'Post id to list comments for' })
  @Type(() => Number)
  @IsInt()
  postId: number;

  @ApiPropertyOptional({ enum: CommentStatus, example: CommentStatus.PENDING })
  @IsOptional()
  @IsEnumValue(CommentStatus)
  status?: CommentStatus;

  @ApiPropertyOptional({
    example: 'great post',
    description: 'Search within comment content',
  })
  @IsOptional()
  @IsString()
  @Transform(({ value }) => {
    return typeof value !== 'string'
      ? value
      : value.trim() === ''
        ? undefined
        : value.trim();
  })
  search?: string;

  @ApiPropertyOptional({ description: 'Next cursor' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  cursor?: number;

  @ApiPropertyOptional({ example: 10, default: 10 })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(1)
  limit: number = 10;
}

export class GetCommentRepliesQueryDto {
  @ApiPropertyOptional({ enum: CommentStatus, example: CommentStatus.PENDING })
  @IsOptional()
  @IsEnumValue(CommentStatus)
  status?: CommentStatus;

  @ApiPropertyOptional({ description: 'Next cursor' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  cursor?: number;

  @ApiPropertyOptional({ example: 10, default: 10 })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(1)
  limit: number = 10;
}

export class UpdateCommentStatusDto {
  @ApiProperty({ enum: CommentStatus, example: CommentStatus.APPROVED })
  @IsEnumValue(CommentStatus)
  status: CommentStatus;
}
