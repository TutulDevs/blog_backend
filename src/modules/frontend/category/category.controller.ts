import {
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Query,
  UseInterceptors,
} from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { CategoryService } from './category.service';
import { OptionalAuth } from '../../../common/decorators/optional_auth.decorator';
import { TransformPostInterceptor } from '../../../common/interceptors/transform_post.interceptor';
import { GetAllCategoriesQueryDto } from './dto/category.dto';
import { FrontendController } from 'src/common/decorators/route.decorator';
import { FrontendApiTags } from 'src/common/decorators/api_tag.decorator';

@FrontendApiTags('categories')
@FrontendController('categories')
@UseInterceptors(TransformPostInterceptor)
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  @Get()
  @OptionalAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get all categories' })
  @ApiResponse({
    status: 200,
    description: 'Request successful, returns all the categories',
  })
  getAllCategories(@Query() query: GetAllCategoriesQueryDto) {
    return this.categoryService.getAllCategories(query);
  }

  @Get(':id')
  @OptionalAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get category by id' })
  @ApiResponse({
    status: 200,
    description: 'Request successful, returns the category',
  })
  getCategoryById(@Param('id', ParseIntPipe) id: number) {
    return this.categoryService.getCategoryById(id);
  }

  @Get(':id/posts')
  @OptionalAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get category & posts by id' })
  @ApiResponse({
    status: 200,
    description: 'Request successful, returns the category & posts',
  })
  getPostsByCategoryId(@Param('id', ParseIntPipe) id: number) {
    return this.categoryService.getPostsByCategoryId(id);
  }

  // GET /api/categories/trending (or /api/categories/popular)
}
