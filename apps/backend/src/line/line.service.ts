import { BadRequestException, Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { messagingApi, webhook } from "@line/bot-sdk";
import { TransactionSource, TransactionType } from "@finance-tracker/shared";
import { LinkService } from "../link/link.service";
import { AutoCategorizerService } from "./categorizer/auto-categorizer.service";
import { LineRepository, type TransactionWithCategory } from "./line.repository";
import { parseLineMessage } from "./parsers/line-message.parser";

function formatAmount(amount: number): string {
  return `฿${amount.toLocaleString("th-TH")}`;
}

function sumByType(transactions: TransactionWithCategory[], type: TransactionType): number {
  return transactions.filter((t) => t.type === type).reduce((sum, t) => sum + t.amount.toNumber(), 0);
}

@Injectable()
export class LineService {
  private readonly logger = new Logger(LineService.name);
  readonly client: messagingApi.MessagingApiClient;

  constructor(
    private readonly config: ConfigService,
    private readonly lineRepository: LineRepository,
    private readonly autoCategorizer: AutoCategorizerService,
    private readonly linkService: LinkService,
  ) {
    this.client = new messagingApi.MessagingApiClient({
      channelAccessToken: this.config.getOrThrow<string>("LINE_CHANNEL_ACCESS_TOKEN"),
    });
  }

  async handleEvents(events: webhook.Event[]): Promise<void> {
    await Promise.all(events.map((event) => this.handleEvent(event)));
  }

  private async handleEvent(event: webhook.Event): Promise<void> {
    if (event.type !== "message" || event.message.type !== "text") return;

    const lineUserId = event.source?.userId;
    if (!lineUserId) return;

    const text = (event.message as webhook.TextMessageContent).text.trim();
    const replyToken = event.replyToken;
    if (!replyToken) return;

    try {
      const linkMatch = text.match(/^เชื่อม\s+(\d{6})$/);
      if (linkMatch) {
        const reply = await this.handleLink(lineUserId, linkMatch[1]);
        await this.client.replyMessage({ replyToken, messages: [{ type: "text", text: reply }] });
        return;
      }

      const user = await this.lineRepository.findOrCreateLineUser(lineUserId);
      const reply = await this.processText(user.id, text);
      await this.client.replyMessage({ replyToken, messages: [{ type: "text", text: reply }] });
    } catch (err) {
      this.logger.error(`Failed to handle LINE message: ${err}`);
    }
  }

  private async processText(userId: string, text: string): Promise<string> {
    const parsed = parseLineMessage(text);

    if (parsed) {
      const category = await this.autoCategorizer.categorize(userId, parsed.description, parsed.type);
      await this.lineRepository.createTransaction({
        userId,
        amount: parsed.amount,
        type: parsed.type,
        description: parsed.description,
        categoryId: category.id,
        source: TransactionSource.LINE,
      });
      return `✅ บันทึกแล้ว: ${parsed.description} ${formatAmount(parsed.amount)} (${category.name})`;
    }

    if (text === "สรุป") return this.buildDailySummary(userId);
    if (text === "เดือนนี้") return this.buildMonthlySummary(userId);
    if (text === "ยกเลิก") return this.handleCancel(userId);

    return this.helpMessage();
  }

  private async buildDailySummary(userId: string): Promise<string> {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const end = new Date(start.getTime() + 86_400_000);
    const txs = await this.lineRepository.findTransactionsInRange(userId, start, end);

    const income = sumByType(txs, TransactionType.INCOME);
    const expense = sumByType(txs, TransactionType.EXPENSE);
    return [`📊 สรุปวันนี้`, `รายรับ: ${formatAmount(income)}`, `รายจ่าย: ${formatAmount(expense)}`, `คงเหลือ: ${formatAmount(income - expense)}`].join("\n");
  }

  private async buildMonthlySummary(userId: string): Promise<string> {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    const txs = await this.lineRepository.findTransactionsInRange(userId, start, end);

    const income = sumByType(txs, TransactionType.INCOME);
    const expense = sumByType(txs, TransactionType.EXPENSE);
    const monthLabel = now.toLocaleDateString("th-TH", { month: "short", year: "numeric" });
    return [`📊 สรุปเดือนนี้ (${monthLabel})`, `รายรับ: ${formatAmount(income)}`, `รายจ่าย: ${formatAmount(expense)}`, `คงเหลือ: ${formatAmount(income - expense)}`].join("\n");
  }

  private async handleCancel(userId: string): Promise<string> {
    const latest = await this.lineRepository.findLatestLineTransaction(userId);
    if (!latest) return "❌ ไม่มีรายการที่จะยกเลิก";

    await this.lineRepository.deleteTransaction(latest.id);
    const label = latest.description ?? latest.category.name;
    return `🗑 ยกเลิกแล้ว: ${label} ${formatAmount(latest.amount.toNumber())}`;
  }

  private async handleLink(lineUserId: string, code: string): Promise<string> {
    try {
      await this.linkService.linkAccount(lineUserId, code);
      return "✅ เชื่อมบัญชีเรียบร้อย ตอนนี้รายการของคุณจะซิงค์กับ web app แล้ว";
    } catch (err) {
      if (err instanceof BadRequestException) return `❌ ${err.message}`;
      this.logger.error(`Link account failed: ${err}`);
      return "❌ เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง";
    }
  }

  private helpMessage(): string {
    return ["💡 วิธีใช้งาน", "• บันทึกรายจ่าย: กาแฟ 65", "• บันทึกรายรับ: เงินเดือน 45,000", "• ดูสรุปวันนี้: สรุป", "• ดูสรุปเดือนนี้: เดือนนี้", "• ลบรายการล่าสุด: ยกเลิก"].join("\n");
  }
}
