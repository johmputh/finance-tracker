import { Module } from "@nestjs/common";
import { LineSignatureGuard } from "./line-signature.guard";
import { LineController } from "./line.controller";
import { LineService } from "./line.service";

@Module({
  controllers: [LineController],
  providers: [LineService, LineSignatureGuard],
  exports: [LineService],
})
export class LineModule {}
