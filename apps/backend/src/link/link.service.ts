import { BadRequestException, Injectable } from "@nestjs/common";
import { LinkRepository } from "./link.repository";

const CODE_TTL_MS = 5 * 60 * 1000;

@Injectable()
export class LinkService {
  constructor(private readonly repository: LinkRepository) {}

  async generateCode(userId: string): Promise<{ code: string; expiresAt: string }> {
    const code = Math.floor(Math.random() * 1_000_000).toString().padStart(6, "0");
    const expiresAt = new Date(Date.now() + CODE_TTL_MS);
    await this.repository.createCode(userId, code, expiresAt);
    return { code, expiresAt: expiresAt.toISOString() };
  }

  async linkAccount(lineUserId: string, code: string): Promise<void> {
    const linkCode = await this.repository.findByCode(code);

    if (!linkCode) throw new BadRequestException("ไม่พบ code นี้");
    if (linkCode.usedAt) throw new BadRequestException("code นี้ถูกใช้แล้ว");
    if (linkCode.expiresAt < new Date()) throw new BadRequestException("code หมดอายุแล้ว");

    const lineUser = await this.repository.findUserByLineId(lineUserId);
    if (!lineUser) throw new BadRequestException("ไม่พบบัญชี LINE");

    await this.repository.moveTransactions(lineUser.id, linkCode.userId);
    await this.repository.deleteUser(lineUser.id);
    await this.repository.updateUserLineId(linkCode.userId, lineUserId);
    await this.repository.markUsed(linkCode.id);
  }
}
