import { useMemo } from 'react';

export default function useSlotsByCell(slots) {
  return useMemo(() => {
    const grouped = new Map();
    slots.forEach((slot) => {
      const key = `${slot.playerId}:${slot.dayOfWeek}`;
      if (!grouped.has(key)) grouped.set(key, []);
      grouped.get(key).push(slot);
    });
    grouped.forEach((cellSlots) => {
      cellSlots.sort((left, right) => (left.startTimeMinutes ?? -1) - (right.startTimeMinutes ?? -1));
    });
    return grouped;
  }, [slots]);
}
