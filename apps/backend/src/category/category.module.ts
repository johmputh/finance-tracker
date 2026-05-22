import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { PrismaModule } from "../prisma/prisma.module";
import { CategoryController } from "./category.controller";
import { CategoryRepository } from "./category.repository";
import { CategoryService } from "./category.service";

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [CategoryController],
  providers: [CategoryService, CategoryRepository],
})
export class CategoryModule {}
