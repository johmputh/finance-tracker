import { TransactionType } from "@finance-tracker/shared";

export interface ParsedTransaction {
  description: string;
  amount: number;
  type: TransactionType;
}

const INCOME_KEYWORDS = ["เงินเดือน", "รายได้", "โบนัส", "ค่าจ้าง"];

const MESSAGE_PATTERN = /^(.+)\s+([\d,]+(?:\.\d+)?)\s*$/;

export function parseLineMessage(text: string): ParsedTransaction | null {
  const normalized = text.trim().replace(/\s+(?:บาท\.?|บ\.)\s*$/, "");
  const match = normalized.match(MESSAGE_PATTERN);
  if (!match) return null;

  const description = match[1].trim();
  const amount = parseFloat(match[2].replace(/,/g, ""));

  if (isNaN(amount) || amount <= 0) return null;

  const type = INCOME_KEYWORDS.some((kw) => description.startsWith(kw))
    ? TransactionType.INCOME
    : TransactionType.EXPENSE;

  return { description, amount, type };
}
