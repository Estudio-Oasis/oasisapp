interface RateBreakdownProps {
  monthlyRate: number | null;
  paymentFrequency: string;
  currency?: string;
}

export function RateBreakdown({ monthlyRate, paymentFrequency, currency = "USD" }: RateBreakdownProps) {
  if (!monthlyRate || monthlyRate <= 0) return null;

  const fmt = (n: number) =>
    n.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 });

  let text = "";
  switch (paymentFrequency) {
    case "biweekly":
      text = `$${fmt(monthlyRate / 2)} × 2 payments = $${fmt(monthlyRate)}/mo`;
      break;
    case "weekly":
      text = `$${fmt(monthlyRate / 4)} × 4 payments = $${fmt(monthlyRate)}/mo`;
      break;
    case "project":
      text = "Project-based rate";
      break;
    default:
      text = `$${fmt(monthlyRate)} per month`;
  }

  return (
    <p className="text-small text-foreground-muted mt-1">{text}</p>
  );
}
