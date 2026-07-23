export type ModeKey = "Flex" | "Fixed" | "Big Amount";
export const MODE_ORDER: ModeKey[] = ["Flex", "Fixed", "Big Amount"];

export type ModeTone = { bg: string; fg: string };

const MODE_TONES: Record<ModeKey, ModeTone> = {
  Flex: { bg: "#E1F5FC", fg: "#00688F" },
  Fixed: { bg: "#E8F6EE", fg: "#0F6E56" },
  "Big Amount": { bg: "#EFEFEF", fg: "#5B5B5B" },
};

function toModeKey(mode: string): ModeKey {
  return mode === "Flex" || mode === "Fixed" ? mode : "Big Amount";
}

export function getModeTone(mode: string): ModeTone {
  return MODE_TONES[toModeKey(mode)];
}
