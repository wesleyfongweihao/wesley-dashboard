import { parseDateString } from "@/lib/dates";

const MONTH_ABBR = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];
const DAY_ABBR = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function formatDDMmmYYYY(dateStr: string): string {
  const d = parseDateString(dateStr);
  const day = String(d.getDate()).padStart(2, "0");
  const month = MONTH_ABBR[d.getMonth()];
  return `${day}-${month}-${d.getFullYear()}`;
}

export function formatDayLabel(dateStr: string): string {
  const d = parseDateString(dateStr);
  return `${DAY_ABBR[d.getDay()]}, ${formatDDMmmYYYY(dateStr)}`;
}

export function formatModeShort(mode: string): string {
  return mode === "Big Amount" ? "Big" : mode;
}

export function formatAmountValue(amount: number): string {
  const rounded = Math.round(amount * 100) / 100;
  return Number.isInteger(rounded) ? rounded.toFixed(0) : rounded.toFixed(2);
}

export function formatRm(amount: number): string {
  return `Rm ${formatAmountValue(amount)}`;
}

export function formatFirstCap(s: string): string {
  return s.length === 0 ? s : s.charAt(0).toUpperCase() + s.slice(1);
}

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  QR: "Qr",
  CC: "Cc",
  Cash: "Cash",
};

export function formatPaymentMethodShort(paymentMethod: string): string {
  return PAYMENT_METHOD_LABELS[paymentMethod] ?? paymentMethod;
}
