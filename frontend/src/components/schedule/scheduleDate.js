import { MONTH_NAMES } from './constants.js';

export function shiftWeek(weekStart, offsetDays) {
  const [year, month, day] = weekStart.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  date.setUTCDate(date.getUTCDate() + offsetDays);
  return date.toISOString().slice(0, 10);
}

export function dateFromWeekStart(weekStart, offset = 0) {
  const [year, month, day] = weekStart.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  date.setUTCDate(date.getUTCDate() + offset);
  return date;
}

export function formatWeekRange(weekStart) {
  if (!weekStart) return '';
  const start = dateFromWeekStart(weekStart, 0);
  const end = dateFromWeekStart(weekStart, 6);
  return `${String(start.getUTCDate()).padStart(2, '0')} ${MONTH_NAMES[start.getUTCMonth()]} - ${String(end.getUTCDate()).padStart(2, '0')} ${MONTH_NAMES[end.getUTCMonth()]}`;
}
