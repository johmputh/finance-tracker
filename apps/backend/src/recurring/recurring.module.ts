import { Module } from "@nestjs/common";
import { RecurringController } from "./recurring.controller";
import { RecurringRepository } from "./recurring.repository";
import { RecurringService } from "./recurring.service";

@Module({
  controllers: [RecurringController],
  providers: [RecurringService, RecurringRepository],
})
export class RecurringModule {}
