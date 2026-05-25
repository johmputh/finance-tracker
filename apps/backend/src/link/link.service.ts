import { BadRequestException, Injectable, Logger } from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";
import { LinkRepository } from "./link.repository";

const CODE_TTL_MS = 5 * 60 * 1000;
const MAX_CODE_ATTEMPTS = 5;

@Injectable()
export class LinkService {
  private readonly logger = new Logger(LinkService.name);

  constructor(private readonly repository: LinkRepository) {}

  async generateCode(userId: string): Promise<{ code: string; expiresAt: string }> {
    const expiresAt = new Date(Date.now() + CODE_TTL_MS);
    for (let attempt = 0; attempt < MAX_CODE_ATTEMPTS; attempt++) {
      const code = Math.floor(Math.random() * 1_000_000).toString().padStart(6, "0");
      try {
        await this.repository.createCode(userId, code, expiresAt);
        return { code, expiresAt: expiresAt.toISOString() };
      } catch (err) {
        if (typeof err === "object" && err !== null && "code" in err && (err as { code: string }).code === "P2002") continue;
        throw err;
      }
    }
    throw new Error("Failed to generate unique link code — please try again");
  }

  async linkAccount(lineUserId: string, code: string): Promise<void> {
    const linkCode = await this.repository.findByCode(code);
    if (!linkCode) throw new BadRequestException("ไม่พบ code นี้");
    if (linkCode.usedAt) throw new BadRequestException("code นี้ถูกใช้แล้ว");
    if (linkCode.expiresAt < new Date()) throw new BadRequestException("code หมดอายุแล้ว");

    const claimed = await this.repository.claimCode(linkCode.id);
    if (!claimed) throw new BadRequestException("code นี้ถูกใช้แล้ว");

    const lineUser = await this.repository.findUserByLineId(lineUserId);
    if (!lineUser) {
      await this.repository.updateUserLineId(linkCode.userId, lineUserId);
      return;
    }

    if (lineUser.id === linkCode.userId) return;

    await this.repository.migrateUserData(lineUser.id, linkCode.userId, lineUserId);
  }

  @Cron(CronExpression.EVERY_HOUR)
  async cleanExpiredCodes(): Promise<void> {
    const count = await this.repository.deleteExpiredCodes();
    if (count > 0) this.logger.log(`Cleaned ${count} expired link codes`);
  }
}
