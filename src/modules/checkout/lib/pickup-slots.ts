/** A selectable store pickup window shown at checkout. */
export type PickupSlot = {
  /** Stable id (ISO start time in UTC). */
  id: string;
  /** Human-readable label in store timezone. */
  label: string;
  startsAt: string;
  endsAt: string;
};

const STORE_TIME_ZONE = "Asia/Kolkata";

const WINDOWS: { startHour: number; endHour: number; label: string }[] = [
  { startHour: 10, endHour: 12, label: "10:00 AM – 12:00 PM" },
  { startHour: 14, endHour: 16, label: "2:00 PM – 4:00 PM" },
  { startHour: 17, endHour: 19, label: "5:00 PM – 7:00 PM" },
];

function getCalendarParts(date: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  return {
    year: Number(parts.find((p) => p.type === "year")?.value),
    month: Number(parts.find((p) => p.type === "month")?.value),
    day: Number(parts.find((p) => p.type === "day")?.value),
  };
}

/** IST wall-clock → UTC (India has no DST). */
function fromStoreTime(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute = 0,
): Date {
  return new Date(Date.UTC(year, month - 1, day, hour - 5, minute - 30, 0));
}

function formatDayLabel(date: Date, timeZone: string): string {
  return new Intl.DateTimeFormat("en-IN", {
    timeZone,
    weekday: "short",
    day: "numeric",
    month: "short",
  }).format(date);
}

/**
 * Lists pickup slots for the next `daysAhead` days (IST), skipping past windows
 * and slots starting within 30 minutes.
 */
export function buildPickupSlots(options?: {
  daysAhead?: number;
  now?: Date;
}): PickupSlot[] {
  const daysAhead = options?.daysAhead ?? 6;
  const now = options?.now ?? new Date();
  const { year, month, day } = getCalendarParts(now, STORE_TIME_ZONE);
  const dayAnchor = fromStoreTime(year, month, day, 0, 0);
  const minStart = now.getTime() + 30 * 60 * 1000;
  const slots: PickupSlot[] = [];

  for (let offset = 0; offset < daysAhead; offset++) {
    const dayDate = new Date(dayAnchor.getTime() + offset * 86_400_000);
    const parts = getCalendarParts(dayDate, STORE_TIME_ZONE);
    const dayLabel = formatDayLabel(dayDate, STORE_TIME_ZONE);

    for (const win of WINDOWS) {
      const startsAt = fromStoreTime(
        parts.year,
        parts.month,
        parts.day,
        win.startHour,
      );
      const endsAt = fromStoreTime(
        parts.year,
        parts.month,
        parts.day,
        win.endHour,
      );
      if (startsAt.getTime() < minStart) continue;

      const id = startsAt.toISOString();
      slots.push({
        id,
        startsAt: id,
        endsAt: endsAt.toISOString(),
        label: `${dayLabel} · ${win.label}`,
      });
    }
  }

  return slots;
}

export function findPickupSlotById(
  slotId: string,
  options?: { daysAhead?: number; now?: Date },
): PickupSlot | null {
  const trimmed = slotId.trim();
  if (!trimmed) return null;
  return buildPickupSlots(options).find((s) => s.id === trimmed) ?? null;
}
