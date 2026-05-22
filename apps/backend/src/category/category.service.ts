import { ConflictException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import type { Category } from "@finance-tracker/database";
import type { CategoryResponse, CreateCategoryDto, FindCategoriesQueryDto, UpdateCategoryDto } from "@finance-tracker/shared";
import { CategoryRepository } from "./category.repository";

@Injectable()
export class CategoryService {
  constructor(private readonly categoryRepository: CategoryRepository) {}

  async findAll(userId: string, query: FindCategoriesQueryDto): Promise<CategoryResponse[]> {
    const categories = await this.categoryRepository.findAllVisible(userId, query.type);
    return categories.map(this.toResponse);
  }

  async create(userId: string, dto: CreateCategoryDto): Promise<CategoryResponse> {
    const category = await this.categoryRepository.create({
      name: dto.name,
      icon: dto.icon,
      type: dto.type,
      userId,
    });
    return this.toResponse(category);
  }

  async update(userId: string, id: string, dto: UpdateCategoryDto): Promise<CategoryResponse> {
    const category = await this.getOwnedCategory(userId, id);
    const updated = await this.categoryRepository.update(category.id, dto);
    return this.toResponse(updated);
  }

  async delete(userId: string, id: string): Promise<void> {
    const category = await this.getOwnedCategory(userId, id);

    const txCount = await this.categoryRepository.countTransactions(category.id);
    if (txCount > 0) {
      throw new ConflictException("Category has linked transactions and cannot be deleted");
    }

    await this.categoryRepository.delete(category.id);
  }

  private async getOwnedCategory(userId: string, id: string): Promise<Category> {
    const category = await this.categoryRepository.findById(id);
    if (!category) throw new NotFoundException("Category not found");
    if (category.userId === null) throw new ForbiddenException("Cannot modify a default category");
    if (category.userId !== userId) throw new ForbiddenException("Category not found");
    return category;
  }

  private toResponse(category: Category): CategoryResponse {
    return {
      id: category.id,
      name: category.name,
      icon: category.icon,
      type: category.type as CategoryResponse["type"],
      userId: category.userId,
      createdAt: category.createdAt.toISOString(),
    };
  }
}
