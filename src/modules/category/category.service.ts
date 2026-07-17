import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { slugify } from '../../lib/functions';
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

  async createCategory(dto: CreateCategoryDto) {
    const slug = slugify(dto.slug ?? dto.name);

    try {
      const category = await this.prisma.category.create({
        data: {
          name: dto.name,
          slug,
          status: dto.status,
        },
      });

      return { category };
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException('Name or slug already in use');
      }
      throw error;
    }
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

  async getCategoryBySlug(slug: string) {
    const category = await this.prisma.category.findUnique({
      where: { slug },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    return { category };
  }

  async updateCategory(id: number, dto: UpdateCategoryDto) {
    await this.findCategoryByIdOrThrow(id);

    try {
      const category = await this.prisma.category.update({
        where: { id },
        data: {
          name: dto.name,
          slug: dto.slug ? slugify(dto.slug) : undefined,
          status: dto.status,
        },
      });

      return { category };
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException('Name or slug already in use');
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
