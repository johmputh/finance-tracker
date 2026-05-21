import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient, type TransactionType } from "@prisma/client";

const defaultCategories: Array<{
  name: string;
  icon: string;
  type: TransactionType;
}> = [
  { name: "อาหาร", icon: "🍔", type: "EXPENSE" },
  { name: "เดินทาง", icon: "🚗", type: "EXPENSE" },
  { name: "ที่อยู่", icon: "🏠", type: "EXPENSE" },
  { name: "สุขภาพ", icon: "💊", type: "EXPENSE" },
  { name: "บันเทิง", icon: "🎬", type: "EXPENSE" },
  { name: "การศึกษา", icon: "📚", type: "EXPENSE" },
  { name: "อื่นๆ", icon: "📦", type: "EXPENSE" },
  { name: "เงินเดือน", icon: "💰", type: "INCOME" },
  { name: "โบนัส", icon: "🎁", type: "INCOME" },
  { name: "รายได้อื่นๆ", icon: "💵", type: "INCOME" },
];

async function main() {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
  const prisma = new PrismaClient({ adapter });

  try {
    for (const category of defaultCategories) {
      // Prisma's compound-unique `where` rejects null, so look up the global
      // row by (name, type, userId=null) and upsert by its id. An empty id
      // never matches a cuid, which forces the create branch on first run.
      const existing = await prisma.category.findFirst({
        where: { name: category.name, type: category.type, userId: null },
        select: { id: true },
      });

      await prisma.category.upsert({
        where: { id: existing?.id ?? "" },
        update: { icon: category.icon },
        create: { ...category, userId: null },
      });
    }
    console.log(`Seeded ${defaultCategories.length} default categories`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
