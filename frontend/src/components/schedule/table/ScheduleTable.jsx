import { useMemo } from 'react';

import { DAY_NAMES } from '../constants.js';
import { dayCellClass } from '../scheduleMetrics.js';
import EventCard from './EventCard.jsx';
import PlayerCell from './PlayerCell.jsx';

export default function ScheduleTable({
  days,
  players,
  slots,
  canEditSelectedWeek,
  onAdd,
  onEdit,
  onNoteHoverStart,
  onNoteHoverEnd,
}) {
  const slotsByCell = useMemo(() => {
    const grouped = new Map();
    slots.forEach((slot) => {
      const key = `${slot.playerId}:${slot.dayOfWeek}`;
      if (!grouped.has(key)) grouped.set(key, []);
      grouped.get(key).push(slot);
    });
    return grouped;
  }, [slots]);

  return (
    <section className="sf-schedule-table">
      <span className="sf-schedule-table-accent" aria-hidden="true" />
      <div className="sf-schedule-table-surface">
        <div className="sf-table-header">
          <div className="sf-table-header-cell sf-table-header-cell--players">Players</div>
          {days.map((day) => {
            const label = DAY_NAMES[day.value] || day.label;
            return (
              <div className={`sf-table-header-cell ${day.isToday ? 'sf-table-header-cell--today' : ''}`} key={day.value}>
                <span className="sf-day-name">{label}</span>
                <span className="sf-day-date">{day.date}</span>
              </div>
            );
          })}
        </div>

        <div className="sf-table-body">
          {players.map((player) => (
            <div className="sf-table-row" key={player.id}>
              <PlayerCell player={player} />
              {days.map((day) => {
                const cellSlots = slotsByCell.get(`${player.id}:${day.value}`) || [];
                const canEditCell = player.canEdit && canEditSelectedWeek;
                return (
                  <div className={`sf-schedule-cell ${dayCellClass(cellSlots)}`} key={`${player.id}-${day.value}`}>
                    {cellSlots.length ? (
                      <div className="sf-cell-events">
                        {cellSlots.map((slot) => (
                          <EventCard
                            key={slot.id}
                            event={slot}
                            onEdit={onEdit}
                            onNoteHoverStart={onNoteHoverStart}
                            onNoteHoverEnd={onNoteHoverEnd}
                          />
                        ))}
                        {canEditCell ? (
                          <button className="sf-cell-add sf-cell-add--compact" type="button" onClick={() => onAdd(day.value)}>
                            +
                          </button>
                        ) : null}
                      </div>
                    ) : canEditCell ? (
                      <button className="sf-cell-add" type="button" onClick={() => onAdd(day.value)} aria-label={`Add slot for ${day.label}`}>
                        +
                      </button>
                    ) : (
                      <span className="sf-cell-add sf-cell-add--disabled">+</span>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
