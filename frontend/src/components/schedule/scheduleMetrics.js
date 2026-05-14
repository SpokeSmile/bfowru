import { buildDayEventMap } from '../../scheduleConfig.js';
import { DAY_NAMES, STATUS_META } from './constants.js';

export function bestDaysByAvailability(days, slots, players) {
  const playerIds = new Set(players.map((player) => player.id));
  const rankedDays = days.map((day) => {
    const availablePlayerIds = new Set();
    slots.forEach((slot) => {
      const isAvailable = slot.slotType === 'available' || slot.slotType === 'full_day_available';
      if (slot.dayOfWeek === day.value && isAvailable && playerIds.has(slot.playerId)) {
        availablePlayerIds.add(slot.playerId);
      }
    });
    return {
      ...day,
      score: availablePlayerIds.size,
      label: DAY_NAMES[day.value] || day.label,
    };
  });

  return rankedDays
    .sort((left, right) => right.score - left.score || left.value - right.value)
    .slice(0, 3);
}

export function buildUpcoming(days, slots, dayEventTypes) {
  const nowDay = days.find((day) => day.isToday)?.value ?? 0;
  const dayEventMap = buildDayEventMap(dayEventTypes);
  const candidates = days
    .map((day) => {
      const dayEvent = dayEventMap.get(day.value);
      const daySlots = slots
        .filter((slot) => slot.dayOfWeek === day.value && slot.startTime)
        .sort((left, right) => left.startTimeMinutes - right.startTimeMinutes);

      if (!dayEvent?.eventType && !daySlots.length) return null;

      return {
        day,
        eventLabel: dayEvent?.eventLabel || 'Activity',
        dateLabel: day.date,
        timeLabel: daySlots[0]?.startTime || '--:--',
        order: day.value >= nowDay ? day.value - nowDay : day.value + 7 - nowDay,
      };
    })
    .filter(Boolean)
    .sort((left, right) => left.order - right.order);

  return candidates[0] || {
    eventLabel: 'No event',
    dateLabel: '--',
    timeLabel: '--:--',
  };
}

export function availabilityByDay(days, players, slots) {
  const playerIds = new Set(players.map((player) => player.id));
  const totalPlayers = playerIds.size;

  return days.map((day) => {
    const availablePlayerIds = new Set();
    slots.forEach((slot) => {
      const isAvailable = slot.slotType === 'available' || slot.slotType === 'full_day_available';
      if (slot.dayOfWeek === day.value && isAvailable && playerIds.has(slot.playerId)) {
        availablePlayerIds.add(slot.playerId);
      }
    });

    const availableCount = availablePlayerIds.size;
    const ratio = totalPlayers ? availableCount / totalPlayers : 0;
    const tone = ratio >= 0.75 ? 'high' : ratio >= 0.5 ? 'mid' : 'low';
    return { ...day, availableCount, totalPlayers, ratio, tone };
  });
}

export function dayCellClass(slots) {
  if (slots.some((slot) => slot.slotType === 'unavailable')) {
    return STATUS_META.unavailable.cellClassName;
  }
  if (slots.some((slot) => slot.slotType === 'tentative')) {
    return STATUS_META.tentative.cellClassName;
  }
  if (slots.some((slot) => slot.slotType === 'full_day_available')) {
    return STATUS_META.full_day_available.cellClassName;
  }
  return '';
}
