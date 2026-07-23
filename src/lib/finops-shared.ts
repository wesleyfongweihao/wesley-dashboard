export type PaymentMethod = "QR" | "CC" | "Cash";
export type Mode = "Fixed" | "Flex" | "Big Amount";

export const PAYMENT_METHODS: PaymentMethod[] = ["QR", "CC", "Cash"];
export const MODES: Mode[] = ["Fixed", "Flex", "Big Amount"];

export const FLEX_CATEGORIES = [
  "Food",
  "Shop",
  "Transport",
  "Sport",
  "Fruits",
  "Entertainment",
  "Events",
  "Others",
] as const;

export const FIXED_ITEMS = [
  "TNG 50",
  "Apple phone",
  "Insurance",
  "Rental",
  "Hair",
  "Grocery",
  "Subscription",
] as const;

export const LOCKED_FIXED_AMOUNTS: Record<string, number> = {
  "TNG 50": 50,
  "Apple phone": 133.31,
  Insurance: 220,
  Rental: 350,
  Hair: 31,
};

export type TransactionRow = {
  id: number;
  txn_date: string;
  payment_method: string;
  mode: string;
  category: string;
  description: string;
  amount: number;
  week_ending: string;
};
