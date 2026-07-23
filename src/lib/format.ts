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

/** e.g. "Thu, 23 Jul" — day-group header format. */
export function formatShortDay(dateStr: string): string {
  const d = parseDateString(dateStr);
  return `${DAY_ABBR[d.getDay()]}, ${d.getDate()} ${MONTH_ABBR[d.getMonth()]}`;
}

export function formatModeShort(mode: string): string {
  return mode === "Big Amount" ? "Big" : mode;
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
