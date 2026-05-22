import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from "@nestjs/common";
import { CategoryResponse, CreateCategoryDto, FindCategoriesQueryDto, UpdateCategoryDto } from "@finance-tracker/shared";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { CurrentUser } from "../auth/current-user.decorator";
import { CategoryService } from "./category.service";

@Controller("categories")
@UseGuards(JwtAuthGuard)
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  @Get()
  findAll(@CurrentUser() userId: string, @Query() query: FindCategoriesQueryDto): Promise<CategoryResponse[]> {
    return this.categoryService.findAll(userId, query);
  }

  @Post()
  create(@CurrentUser() userId: string, @Body() dto: CreateCategoryDto): Promise<CategoryResponse> {
    return this.categoryService.create(userId, dto);
  }

  @Patch(":id")
  update(
    @CurrentUser() userId: string,
    @Param("id") id: string,
    @Body() dto: UpdateCategoryDto,
  ): Promise<CategoryResponse> {
    return this.categoryService.update(userId, id, dto);
  }

  @Delete(":id")
  delete(@CurrentUser() userId: string, @Param("id") id: string): Promise<void> {
    return this.categoryService.delete(userId, id);
  }
}
