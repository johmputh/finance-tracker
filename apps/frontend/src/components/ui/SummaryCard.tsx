interface SummaryCardProps {
  title: string;
  amount: number;
  amountClass: string;
}

export function SummaryCard({ title, amount, amountClass }: SummaryCardProps) {
  return (
    <div className="bg-zinc-900 rounded-xl border border-zinc-800 shadow-lg p-6">
      <p className="text-zinc-400 text-sm font-medium mb-2">{title}</p>
      <p className={`text-2xl font-bold ${amountClass}`}>
        ฿{amount.toLocaleString("th-TH")}
      </p>
    </div>
  );
}
