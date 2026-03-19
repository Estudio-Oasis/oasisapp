interface RateBreakdownProps {
  monthlyRate: number | null;
  paymentFrequency: string;
  currency?: string;
}

export function RateBreakdown({ monthlyRate, paymentFrequency, currency = "USD" }: RateBreakdownProps) {
  if (!monthlyRate || monthlyRate <= 0) return null;

  const fmt = (n: number) =>
    n.toLocaleString("es-MX", { minimumFractionDigits: 0, maximumFractionDigits: 0 });

  let text = "";
  switch (paymentFrequency) {
    case "biweekly":
      text = `$${fmt(monthlyRate / 2)} × 2 pagos = $${fmt(monthlyRate)}/mes`;
      break;
    case "weekly":
      text = `$${fmt(monthlyRate / 4)} × 4 pagos = $${fmt(monthlyRate)}/mes`;
      break;
    case "project":
      text = "Tarifa por proyecto";
      break;
    default:
      text = `$${fmt(monthlyRate)} por mes`;
  }

  return (
    <p className="text-small text-foreground-muted mt-1">{text}</p>
  );
}
