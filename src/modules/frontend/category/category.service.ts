import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import {
  CreateCategoryDto,
  GetAllCategoriesQueryDto,
  UpdateCategoryDto,
} from './dto/category.dto';

@Injectable()
export class CategoryService {
  constructor(private readonly prisma: PrismaService) {}

  private async findCategoryByIdOrThrow(id: number) {
    const category = await this.prisma.category.findUnique({ where: { id } });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    return category;
  }

  async getAllCategories(query: GetAllCategoriesQueryDto) {
    const { search, status, sortBy, sortOrder, page, limit } = query;

    const where: Prisma.CategoryWhereInput = {};

    if (status !== undefined) {
      where.status = status;
    }

    if (search) {
      where.name = { contains: search, mode: 'insensitive' };
    }

    const skip = (page - 1) * limit;
    const take = limit;

    const [totalFilteredCategories, categories] = await Promise.all([
      this.prisma.category.count({ where }),
      this.prisma.category.findMany({
        where,
        skip,
        take,
        orderBy: !sortBy ? { createdAt: 'desc' } : { [sortBy]: sortOrder },
        // include: { _count: { select: { posts: true } } },
      }),
    ]);

    return {
      meta: {
        totalCount: totalFilteredCategories,
        page,
        limit,
        totalPages: Math.ceil(totalFilteredCategories / limit),
      },
      list: categories,
    };
  }

  async getCategoryById(id: number) {
    return await this.findCategoryByIdOrThrow(id);
  }

  async getPostsByCategoryId(id: number) {
    await this.findCategoryByIdOrThrow(id);

    const category = await this.prisma.category.findUnique({
      where: { id },
      include: { posts: true },
    });

    return { category };
  }

  async createCategory(dto: CreateCategoryDto) {
    try {
      const category = await this.prisma.category.create({
        data: { ...dto },
      });

      return { message: 'Category created successfully', category };
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException('Name already in use');
      }
      throw error;
    }
  }

  async updateCategory(id: number, dto: UpdateCategoryDto) {
    await this.findCategoryByIdOrThrow(id);

    try {
      const category = await this.prisma.category.update({
        where: { id },
        data: { ...dto },
      });

      return { message: 'Category updated successfully', category };
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException('Name already in use');
      }
      throw error;
    }
  }

  async deleteCategory(id: number) {
    await this.findCategoryByIdOrThrow(id);

    await this.prisma.category.delete({ where: { id } });

    return { message: 'Category deleted successfully' };
  }
}
