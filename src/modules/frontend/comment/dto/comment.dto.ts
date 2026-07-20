import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateCommentDto {
  @ApiProperty({ example: 1 })
  @Type(() => Number)
  @IsInt()
  postId: number;

  @ApiProperty({ example: 'Great article, thanks for sharing!' })
  @IsString()
  @IsNotEmpty()
  content: string;

  @ApiPropertyOptional({ description: 'Parent comment id for reply' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  parentId?: number;
}

export class UpdateCommentDto {
  @ApiProperty({ example: 'Edited: great article, thanks for sharing!' })
  @IsString()
  @IsNotEmpty()
  content: string;
}

export class GetCommentsByPostIdQueryDto {
  @ApiPropertyOptional({ description: 'Next cursor' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  cursor?: number;

  @ApiPropertyOptional({ example: 5, default: 5 })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(1)
  limit: number = 5;
}
