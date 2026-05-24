import { Module } from "@nestjs/common";
import { CategoryModule } from "../category/category.module";
import { AutoCategorizerService } from "./categorizer/auto-categorizer.service";
import { LineSignatureGuard } from "./line-signature.guard";
import { LineController } from "./line.controller";
import { LineRepository } from "./line.repository";
import { LineService } from "./line.service";

@Module({
  imports: [CategoryModule],
  controllers: [LineController],
  providers: [LineService, LineRepository, LineSignatureGuard, AutoCategorizerService],
  exports: [LineService],
})
export class LineModule {}
