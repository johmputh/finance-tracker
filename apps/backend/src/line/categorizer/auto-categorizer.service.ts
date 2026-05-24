import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import OpenAI from "openai";
import type { Category } from "@finance-tracker/database";
import { TransactionType } from "@finance-tracker/shared";
import { CategoryRepository } from "../../category/category.repository";

const FALLBACK_NAME: Record<TransactionType, string> = {
  [TransactionType.EXPENSE]: "อื่นๆ",
  [TransactionType.INCOME]: "รายได้อื่นๆ",
};

@Injectable()
export class AutoCategorizerService {
  private readonly logger = new Logger(AutoCategorizerService.name);
  private readonly openai: OpenAI;
  private readonly cache = new Map<string, Category>();

  constructor(
    private readonly config: ConfigService,
    private readonly categoryRepository: CategoryRepository,
  ) {
    this.openai = new OpenAI({
      apiKey: this.config.getOrThrow<string>("OPENAI_API_KEY"),
    });
  }

  async categorize(userId: string, description: string, type: TransactionType): Promise<Category> {
    const cacheKey = `${userId}:${description}:${type}`;
    const cached = this.cache.get(cacheKey);
    if (cached) return cached;

    const categories = await this.categoryRepository.findAllVisible(userId, type);
    const result = (await this.askOpenAI(description, type, categories)) ?? this.fallback(categories, type);

    this.cache.set(cacheKey, result);
    return result;
  }

  private async askOpenAI(description: string, type: TransactionType, categories: Category[]): Promise<Category | null> {
    const names = categories.map((c) => c.name).join(", ");
    try {
      const response = await this.openai.chat.completions.create({
        model: "gpt-4.1-mini",
        messages: [
          {
            role: "system",
            content: "You are a personal finance assistant. Reply with ONLY the exact category name from the provided list. No explanation.",
          },
          {
            role: "user",
            content: `Transaction: ${description}\nType: ${type}\nCategories: ${names}`,
          },
        ],
        max_tokens: 20,
        temperature: 0,
      });

      const chosen = response.choices[0]?.message.content?.trim();
      return categories.find((c) => c.name === chosen) ?? null;
    } catch (err) {
      this.logger.warn(`OpenAI categorization failed: ${err}`);
      return null;
    }
  }

  private fallback(categories: Category[], type: TransactionType): Category {
    return categories.find((c) => c.name === FALLBACK_NAME[type]) ?? categories[0];
  }
}
