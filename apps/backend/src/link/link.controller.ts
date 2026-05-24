import { Controller, HttpCode, Post, UseGuards } from "@nestjs/common";
import { CurrentUser } from "../auth/current-user.decorator";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { LinkService } from "./link.service";

@Controller("link")
export class LinkController {
  constructor(private readonly linkService: LinkService) {}

  @Post("code")
  @UseGuards(JwtAuthGuard)
  @HttpCode(201)
  generateCode(@CurrentUser() userId: string): Promise<{ code: string; expiresAt: string }> {
    return this.linkService.generateCode(userId);
  }
}
