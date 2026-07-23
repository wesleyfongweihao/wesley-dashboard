import { LOCKED_FIXED_AMOUNTS } from "@/lib/finops-shared";

export type CategoryConfig =
  | { type: "flat" }
  | { type: "locked"; amount: number }
  | { type: "picker"; label: string; options: readonly string[] };

const PICKER_CONFIG: Record<string, { label: string; options: readonly string[] }> = {
  Subscription: {
    label: "Subscription",
    options: [
      "The Edge News",
      "Chat GPT",
      "Claude",
      "Habbit App",
      "The Futurists",
      "YouTube",
      "Grab Unlimited",
      "Others",
    ],
  },
  Grocery: {
    label: "Item",
    options: ["Farm Fresh", "Jobbie", "Greek Yogurt", "Granola", "Blueberry", "Almond", "Others"],
  },
  Sport: {
    label: "Sport Type",
    options: [
      "Badminton",
      "Badminton Equipment",
      "Golf",
      "Gym",
      "Pickle Ball",
      "Running",
      "Hike",
      "Others",
    ],
  },
  Transport: {
    label: "Item",
    options: ["Grab", "Indriver", "Maxim", "Taxi", "Bus", "Bolt", "Fuel Oil Car", "Others"],
  },
};

/** category -> behavior when tapped in the Add sheet's Category grid.
 * Add a new entry to PICKER_CONFIG (or LOCKED_FIXED_AMOUNTS for a flat
 * auto-fill) to extend this without touching the sheet's rendering logic. */
export function getCategoryConfig(category: string): CategoryConfig {
  if (category in LOCKED_FIXED_AMOUNTS) {
    return { type: "locked", amount: LOCKED_FIXED_AMOUNTS[category] };
  }
  const picker = PICKER_CONFIG[category];
  if (picker) return { type: "picker", ...picker };
  return { type: "flat" };
}

/** For edit-mode pre-fill: given a picker category and its saved
 * description, figure out which sub-option it corresponds to (or "Others"
 * if the description doesn't match a known option). */
export function deriveSubOption(category: string, description: string): string | null {
  const config = getCategoryConfig(category);
  if (config.type !== "picker") return null;
  return config.options.includes(description) && description !== "Others"
    ? description
    : "Others";
}
