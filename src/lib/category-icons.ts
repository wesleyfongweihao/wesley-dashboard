import {
  Apple,
  Banknote,
  Car,
  Clapperboard,
  CreditCard,
  Dumbbell,
  Home,
  Receipt,
  RefreshCw,
  Scissors,
  Shield,
  ShoppingBag,
  ShoppingCart,
  Smartphone,
  Ticket,
  Utensils,
  type LucideIcon,
} from "lucide-react";

const CATEGORY_ICONS: Record<string, LucideIcon> = {
  Food: Utensils,
  Shop: ShoppingBag,
  Transport: Car,
  Sport: Dumbbell,
  Fruits: Apple,
  Fruit: Apple,
  Entertainment: Clapperboard,
  Events: Ticket,
  "TNG 50": CreditCard,
  "Apple phone": Smartphone,
  Insurance: Shield,
  Rental: Home,
  Hair: Scissors,
  Grocery: ShoppingCart,
  Subscription: RefreshCw,
};

export function getCategoryIcon(category: string): LucideIcon {
  return CATEGORY_ICONS[category] ?? (category === "Others" ? Receipt : Banknote);
}
