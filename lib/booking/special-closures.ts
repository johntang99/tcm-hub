import type { BookingSettings, BookingSpecialClosure } from '@/lib/types';

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function isValidIsoDate(value: string) {
  if (!DATE_PATTERN.test(value)) return false;
  const [year, month, day] = value.split('-').map(Number);
  const utc = Date.UTC(year, month - 1, day);
  const parsed = new Date(utc);
  return (
    parsed.getUTCFullYear() === year &&
    parsed.getUTCMonth() === month - 1 &&
    parsed.getUTCDate() === day
  );
}

function normalizeDateValue(value: unknown) {
  const trimmed = String(value || '').trim();
  if (!trimmed || !isValidIsoDate(trimmed)) return null;
  return trimmed;
}

export function normalizeSpecialClosures(
  closures: BookingSettings['specialClosures']
): BookingSpecialClosure[] {
  const list = Array.isArray(closures) ? closures : [];
  const byDate = new Map<string, BookingSpecialClosure>();
  for (const closure of list) {
    if (!closure || typeof closure !== 'object') continue;
    const date = normalizeDateValue(closure.date);
    if (!date) continue;
    byDate.set(date, {
      date,
      reason: typeof closure.reason === 'string' ? closure.reason.trim() || undefined : undefined,
      noteEn: typeof closure.noteEn === 'string' ? closure.noteEn.trim() || undefined : undefined,
      noteZh: typeof closure.noteZh === 'string' ? closure.noteZh.trim() || undefined : undefined,
      blocksBooking: closure.blocksBooking !== false,
      showOnContact: closure.showOnContact !== false,
    });
  }
  return [...byDate.values()].sort((a, b) => a.date.localeCompare(b.date));
}

export function getBlockedDatesWithSpecialClosures(settings: BookingSettings): string[] {
  const blocked = new Set(
    (Array.isArray(settings.blockedDates) ? settings.blockedDates : [])
      .map((item) => normalizeDateValue(item))
      .filter((item): item is string => Boolean(item))
  );
  for (const closure of normalizeSpecialClosures(settings.specialClosures)) {
    if (closure.blocksBooking !== false) {
      blocked.add(closure.date);
    }
  }
  return [...blocked].sort((a, b) => a.localeCompare(b));
}

export function normalizeBookingSettings(settings: BookingSettings): BookingSettings {
  const specialClosures = normalizeSpecialClosures(settings.specialClosures);
  return {
    ...settings,
    blockedDates: getBlockedDatesWithSpecialClosures({ ...settings, specialClosures }),
    specialClosures,
  };
}

export function findSpecialClosureForDate(
  settings: BookingSettings,
  date: string
): BookingSpecialClosure | null {
  if (!isValidIsoDate(date)) return null;
  const closure = normalizeSpecialClosures(settings.specialClosures).find(
    (item) => item.date === date
  );
  if (!closure || closure.blocksBooking === false) return null;
  return closure;
}

export function getTodayInTimezone(timezone: string) {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone || 'UTC',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  const parts = formatter.formatToParts(new Date());
  const map: Record<string, string> = {};
  parts.forEach((part) => {
    if (part.type !== 'literal') {
      map[part.type] = part.value;
    }
  });
  return `${map.year}-${map.month}-${map.day}`;
}

export function listUpcomingContactClosures(
  settings: BookingSettings,
  fromDate: string,
  limit = 5
) {
  return normalizeSpecialClosures(settings.specialClosures)
    .filter((item) => item.showOnContact !== false && item.date >= fromDate)
    .slice(0, limit);
}
