import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CategoryService } from './category.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { OptionalAuth } from '../../common/decorators/optional-auth.decorator';
import { StaffRole } from '../../lib/coreconstants';
import { TransformPostInterceptor } from '../../common/interceptors/transform_post.interceptor';
import {
  CreateCategoryDto,
  GetAllCategoriesQueryDto,
  UpdateCategoryDto,
} from './dto/category.dto';

@ApiTags('categories')
@ApiBearerAuth()
@Controller('categories')
@UseGuards(JwtAuthGuard, RolesGuard)
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

  @Post()
  @Roles(StaffRole.ADMIN)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new category (admin only)' })
  @ApiResponse({ status: 201, description: 'Category created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid body' })
  @ApiResponse({ status: 401, description: 'Not logged in' })
  @ApiResponse({
    status: 403,
    description: 'Logged in but not permitted (non-admin)',
  })
  @ApiResponse({ status: 409, description: 'Name already in use' })
  createCategory(@Body() dto: CreateCategoryDto) {
    return this.categoryService.createCategory(dto);
  }

  @Patch(':id')
  @Roles(StaffRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update category (admin only)' })
  @ApiResponse({
    status: 200,
    description: 'Request successful, returns the updated category',
  })
  @ApiResponse({ status: 400, description: 'Invalid id or body' })
  @ApiResponse({ status: 401, description: 'Not logged in' })
  @ApiResponse({
    status: 403,
    description: 'Logged in but not permitted (non-admin)',
  })
  @ApiResponse({ status: 404, description: 'Category not found' })
  @ApiResponse({ status: 409, description: 'Name already in use' })
  updateCategory(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateCategoryDto,
  ) {
    return this.categoryService.updateCategory(id, dto);
  }

  @Delete(':id')
  @Roles(StaffRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete category (admin only)' })
  @ApiResponse({ status: 200, description: 'Category deleted successfully' })
  @ApiResponse({ status: 400, description: 'Invalid id format' })
  @ApiResponse({ status: 401, description: 'Not logged in' })
  @ApiResponse({
    status: 403,
    description: 'Logged in but not permitted (non-admin)',
  })
  @ApiResponse({ status: 404, description: 'Category not found' })
  deleteCategory(@Param('id', ParseIntPipe) id: number) {
    return this.categoryService.deleteCategory(id);
  }
}
