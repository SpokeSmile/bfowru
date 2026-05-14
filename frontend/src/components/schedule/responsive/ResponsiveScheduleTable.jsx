import { DAY_NAMES } from '../constants.js';
import useSlotsByCell from '../hooks/useSlotsByCell.js';
import { dayCellClass } from '../scheduleMetrics.js';
import EventCard from '../table/EventCard.jsx';
import ResponsivePlayerInline from './ResponsivePlayerInline.jsx';

export default function ResponsiveScheduleTable({
  days,
  players,
  slots,
  canEditSelectedWeek,
  onAdd,
  onEdit,
  onNoteHoverStart,
  onNoteHoverEnd,
}) {
  const slotsByCell = useSlotsByCell(slots);

  return (
    <section className="sfr-table-card">
      <div className="sfr-table-scroll">
        <div className="sfr-table">
          <div className="sfr-table-head sfr-table-row">
            <div className="sfr-table-head-cell sfr-table-head-cell--players">Players</div>
            {days.map((day) => (
              <div className={`sfr-table-head-cell ${day.isToday ? 'sfr-table-head-cell--today' : ''}`} key={day.value}>
                <strong>{DAY_NAMES[day.value] || day.label}</strong>
                <span>{day.date}</span>
              </div>
            ))}
          </div>

          {players.map((player) => (
            <div className="sfr-table-row" key={player.id}>
              <div className="sfr-table-player-cell">
                <ResponsivePlayerInline player={player} />
              </div>
              {days.map((day) => {
                const cellSlots = slotsByCell.get(`${player.id}:${day.value}`) || [];
                const canEditCell = player.canEdit && canEditSelectedWeek;
                return (
                  <div className={`sfr-table-cell ${dayCellClass(cellSlots)}`} key={`${player.id}-${day.value}`}>
                    {cellSlots.length ? (
                      <div className="sfr-cell-events">
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
                          <button className="sfr-add-compact" type="button" onClick={() => onAdd(day.value)}>
                            +
                          </button>
                        ) : null}
                      </div>
                    ) : canEditCell ? (
                      <button className="sfr-add-empty" type="button" onClick={() => onAdd(day.value)} aria-label={`Add slot for ${day.label}`}>
                        +
                      </button>
                    ) : (
                      <span className="sfr-add-empty sfr-add-empty--disabled">+</span>
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
