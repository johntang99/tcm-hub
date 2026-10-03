import { findSpecialClosureForDate } from '@/lib/booking/special-closures';
import type {
  BookingRecord,
  BookingService,
  BookingSettings,
  BookingSpecialClosure,
} from '@/lib/types';

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function parseTimeToMinutes(value: string) {
  const [hours, minutes] = value.split(':').map(Number);
  return hours * 60 + minutes;
}

function formatMinutesToTime(value: number) {
  const hours = Math.floor(value / 60)
    .toString()
    .padStart(2, '0');
  const minutes = (value % 60).toString().padStart(2, '0');
  return `${hours}:${minutes}`;
}

function getTimeZoneParts(timeZone: string, date: Date) {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
  const parts = formatter.formatToParts(date);
  const map: Record<string, string> = {};
  parts.forEach((part) => {
    if (part.type !== 'literal') {
      map[part.type] = part.value;
    }
  });
  return {
    year: Number(map.year),
    month: Number(map.month),
    day: Number(map.day),
    hour: Number(map.hour),
    minute: Number(map.minute),
    second: Number(map.second),
  };
}

function buildUtcFromLocalParts(parts: {
  year: number;
  month: number;
  day: number;
  hour?: number;
  minute?: number;
  second?: number;
}) {
  return Date.UTC(
    parts.year,
    parts.month - 1,
    parts.day,
    parts.hour ?? 0,
    parts.minute ?? 0,
    parts.second ?? 0
  );
}

function getNowUtcForTimeZone(timeZone: string) {
  const parts = getTimeZoneParts(timeZone, new Date());
  return buildUtcFromLocalParts(parts);
}

function getDayName(date: string) {
  const [year, month, day] = date.split('-').map(Number);
  const utc = Date.UTC(year, month - 1, day);
  const dayIndex = new Date(utc).getUTCDay();
  return DAY_NAMES[dayIndex];
}

export function getBusinessHoursForDate(
  date: string,
  settings: BookingSettings
) {
  const blocked = getDateBlockContext(date, settings);
  if (blocked) return null;
  const dayName = getDayName(date);
  const hours = settings.businessHours.find((entry) => entry.day === dayName);
  if (!hours || hours.closed) return null;
  return hours;
}

export type DateBlockReason =
  | 'blackout_window'
  | 'special_closure'
  | 'blocked_date'
  | 'weekly_closed';

export interface DateBlockContext {
  reason: DateBlockReason;
  blackoutReason?: string;
  specialClosure?: BookingSpecialClosure;
}

export function getDateBlockContext(
  date: string,
  settings: BookingSettings
): DateBlockContext | null {
  const blackout = Array.isArray(settings.blackoutWindows)
    ? settings.blackoutWindows.find((window) => date >= window.start && date <= window.end)
    : null;
  if (blackout) {
    return { reason: 'blackout_window', blackoutReason: blackout.reason };
  }
  const specialClosure = findSpecialClosureForDate(settings, date);
  if (specialClosure) {
    return { reason: 'special_closure', specialClosure };
  }
  if (settings.blockedDates.includes(date)) {
    return { reason: 'blocked_date' };
  }
  const dayName = getDayName(date);
  const hours = settings.businessHours.find((entry) => entry.day === dayName);
  if (!hours || hours.closed) {
    return { reason: 'weekly_closed' };
  }
  return null;
}

export function getDateBlockMessage(
  blocked: DateBlockContext,
  locale: 'en' | 'zh' = 'en'
) {
  if (blocked.reason === 'special_closure' && blocked.specialClosure) {
    const closure = blocked.specialClosure;
    if (locale === 'zh') {
      const note = closure.noteZh || closure.reason || closure.noteEn;
      return note
        ? `该日期暂停预约：${note}`
        : '该日期为休诊日，暂不提供预约。';
    }
    const note = closure.noteEn || closure.reason || closure.noteZh;
    return note
      ? `This date is unavailable: ${note}`
      : 'This date is closed and unavailable for booking.';
  }
  if (locale === 'zh') {
    if (blocked.reason === 'blackout_window') {
      return blocked.blackoutReason
        ? `该日期暂停预约：${blocked.blackoutReason}`
        : '该日期暂不接受预约。';
    }
    if (blocked.reason === 'weekly_closed') {
      return '该日期为固定休息日，暂不提供预约。';
    }
    return '该日期暂不提供预约。';
  }
  if (blocked.reason === 'blackout_window') {
    return blocked.blackoutReason
      ? `This date is unavailable: ${blocked.blackoutReason}`
      : 'This date is temporarily unavailable for booking.';
  }
  if (blocked.reason === 'weekly_closed') {
    return 'This date falls on a regular closed day.';
  }
  return 'This date is unavailable for booking.';
}

export function generateAvailableSlots({
  date,
  service,
  settings,
  bookings,
}: {
  date: string;
  service: BookingService;
  settings: BookingSettings;
  bookings: BookingRecord[];
}) {
  const hours = getBusinessHoursForDate(date, settings);
  if (!hours) return [];

  const openMinutes = parseTimeToMinutes(hours.open);
  const closeMinutes = parseTimeToMinutes(hours.close);
  const duration = service.durationMinutes;
  const step = duration + settings.bufferMinutes;
  const perServiceLeadHours = Number(service.leadTimeHours || 0);
  const minNoticeHours = Math.max(settings.minNoticeHours, perServiceLeadHours);
  const capacityPerSlot = Math.max(
    1,
    Number(service.capacityPerSlot || settings.maxOrdersPerSlot || 1)
  );

  const nowUtc = getNowUtcForTimeZone(settings.timezone);
  const minNoticeUtc = nowUtc + minNoticeHours * 60 * 60 * 1000;

  const slots: string[] = [];
  for (
    let start = openMinutes;
    start + duration <= closeMinutes;
    start += step
  ) {
    const slotTime = formatMinutesToTime(start);
    if (Array.isArray(service.availableWindows) && service.availableWindows.length > 0) {
      const dayName = getDayName(date);
      const windowsForDay = service.availableWindows.filter((window) => window.day === dayName);
      const allowedByWindow = windowsForDay.some((window) => {
        const windowStart = parseTimeToMinutes(window.start);
        const windowEnd = parseTimeToMinutes(window.end);
        return start >= windowStart && start + duration <= windowEnd;
      });
      if (!allowedByWindow) {
        continue;
      }
    }
    const slotUtc = buildUtcFromLocalParts({
      year: Number(date.slice(0, 4)),
      month: Number(date.slice(5, 7)),
      day: Number(date.slice(8, 10)),
      hour: Number(slotTime.slice(0, 2)),
      minute: Number(slotTime.slice(3, 5)),
    });
    if (slotUtc < minNoticeUtc) {
      continue;
    }

    const overlappingCount = bookings.filter((booking) => {
      if (booking.status === 'cancelled') return false;
      if (booking.date !== date) return false;
      const bookingStart = parseTimeToMinutes(booking.time);
      const bookingEnd = bookingStart + booking.durationMinutes + settings.bufferMinutes;
      const slotEnd = start + duration;
      return start < bookingEnd && slotEnd > bookingStart;
    }).length;
    if (overlappingCount < capacityPerSlot) {
      slots.push(slotTime);
    }
  }
  return slots;
}

export function isDateWithinRange({
  date,
  settings,
}: {
  date: string;
  settings: BookingSettings;
}) {
  const nowUtc = getNowUtcForTimeZone(settings.timezone);
  const dateUtc = buildUtcFromLocalParts({
    year: Number(date.slice(0, 4)),
    month: Number(date.slice(5, 7)),
    day: Number(date.slice(8, 10)),
  });
  const maxUtc = nowUtc + settings.maxDaysAhead * 24 * 60 * 60 * 1000;
  return dateUtc >= nowUtc && dateUtc <= maxUtc;
}
