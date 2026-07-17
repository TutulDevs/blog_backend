import {
  Body,
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
import { ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { B_CategoryService } from './category.service';
import { B_JwtAuthGuard } from '../../../common/guards/b_jwt_auth.guard';
import { B_RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { StaffRole } from '../../../lib/coreconstants';
import {
  CreateCategoryDto,
  GetAllCategoriesQueryDto,
  UpdateCategoryDto,
} from './dto/category.dto';
import { BackofficeController } from '../../../common/decorators/route.decorator';
import { BackofficeApiTags } from '../../../common/decorators/api_tag.decorator';
import { TransformPostInterceptor } from '../../../common/interceptors/transform_post.interceptor';

@BackofficeApiTags('categories')
@ApiBearerAuth()
@BackofficeController('categories')
@UseGuards(B_JwtAuthGuard, B_RolesGuard)
@UseInterceptors(TransformPostInterceptor)
export class B_CategoryController {
  constructor(private readonly categoryService: B_CategoryService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get all categories' })
  @ApiResponse({
    status: 200,
    description: 'Request successful, returns all the categories',
  })
  @ApiResponse({ status: 401, description: 'Not logged in or unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Logged in but not permitted (non-admin)',
  })
  getAllCategories(@Query() query: GetAllCategoriesQueryDto) {
    return this.categoryService.getAllCategories(query);
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get category by id' })
  @ApiResponse({
    status: 200,
    description: 'Request successful, returns the category',
  })
  @ApiResponse({ status: 401, description: 'Not logged in or unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Logged in but not permitted (non-admin)',
  })
  @ApiResponse({ status: 404, description: 'Category not found' })
  getCategoryById(@Param('id', ParseIntPipe) id: number) {
    return this.categoryService.getCategoryById(id);
  }

  @Post()
  @Roles(StaffRole.ADMIN)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a category (admin only)' })
  @ApiResponse({
    status: 201,
    description: 'Request successful, returns the created category',
  })
  @ApiResponse({ status: 401, description: 'Not logged in or unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Logged in but not permitted (non-admin)',
  })
  @ApiResponse({ status: 409, description: 'Category name already exists' })
  createCategory(@Body() dto: CreateCategoryDto) {
    return this.categoryService.createCategory(dto);
  }

  @Patch(':id')
  @Roles(StaffRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update a category (admin only)' })
  @ApiResponse({
    status: 200,
    description: 'Request successful, returns the updated category',
  })
  @ApiResponse({ status: 401, description: 'Not logged in or unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Logged in but not permitted (non-admin)',
  })
  @ApiResponse({ status: 404, description: 'Category not found' })
  @ApiResponse({ status: 409, description: 'Category name already exists' })
  updateCategory(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateCategoryDto,
  ) {
    return this.categoryService.updateCategory(id, dto);
  }

  @Delete(':id')
  @Roles(StaffRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a category (admin only)' })
  @ApiResponse({ status: 200, description: 'Category deleted successfully' })
  @ApiResponse({ status: 401, description: 'Not logged in or unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Logged in but not permitted (non-admin)',
  })
  @ApiResponse({ status: 404, description: 'Category not found' })
  deleteCategory(@Param('id', ParseIntPipe) id: number) {
    return this.categoryService.deleteCategory(id);
  }
}
