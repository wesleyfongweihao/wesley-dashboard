export function toDateString(d: Date) {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function parseDateString(s: string) {
  const [year, month, day] = s.split("-").map(Number);
  return new Date(year, month - 1, day);
}

/** Mon–Sun week; weekEnding is the Sunday on/after the anchor date. */
export function getWeekRange(anchor: Date) {
  const dayOfWeek = anchor.getDay();
  const daysToSunday = (7 - dayOfWeek) % 7;
  const weekEndingDate = new Date(
    anchor.getFullYear(),
    anchor.getMonth(),
    anchor.getDate() + daysToSunday
  );
  const weekStartDate = new Date(
    weekEndingDate.getFullYear(),
    weekEndingDate.getMonth(),
    weekEndingDate.getDate() - 6
  );
  return {
    weekStart: toDateString(weekStartDate),
    weekEnding: toDateString(weekEndingDate),
  };
}

export function addWeeks(weekEndingStr: string, delta: number) {
  const d = parseDateString(weekEndingStr);
  const shifted = new Date(d.getFullYear(), d.getMonth(), d.getDate() + delta * 7);
  return toDateString(shifted);
}

export function getWeekRangeLabel(weekEndingStr: string) {
  const weekEnding = parseDateString(weekEndingStr);
  const weekStart = new Date(
    weekEnding.getFullYear(),
    weekEnding.getMonth(),
    weekEnding.getDate() - 6
  );
  const sameMonth = weekStart.getMonth() === weekEnding.getMonth();
  const startFmt = weekStart.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
  const endFmt = weekEnding.toLocaleDateString("en-US", {
    month: sameMonth ? undefined : "short",
    day: "numeric",
    year: "numeric",
  });
  return `${startFmt} – ${endFmt}`;
}
