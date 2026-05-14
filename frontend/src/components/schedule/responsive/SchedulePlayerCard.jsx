import { Plus } from 'lucide-react';

import { STATUS_META } from '../constants.js';
import { dayCellClass } from '../scheduleMetrics.js';
import ResponsivePlayerInline from './ResponsivePlayerInline.jsx';

function MobileEventCard({ event, onEdit }) {
  const statusMeta = STATUS_META[event.slotType];
  const isAllDayStatus = Boolean(statusMeta);
  const className = statusMeta?.className || 'sf-event-card--time';

  const content = (
    <>
      <span className="sfr-mobile-event-main">{isAllDayStatus ? statusMeta.label : event.timeRange}</span>
      {event.note ? <span className="sfr-mobile-event-note">{event.note}</span> : null}
    </>
  );

  if (!event.canEdit) {
    return <article className={`sfr-mobile-event ${className}`}>{content}</article>;
  }

  return (
    <button className={`sfr-mobile-event ${className}`} type="button" onClick={() => onEdit(event)}>
      {content}
    </button>
  );
}

export default function SchedulePlayerCard({ player, day, slots, canEditSelectedWeek, onAdd, onEdit }) {
  const canEditCell = player.canEdit && canEditSelectedWeek;

  return (
    <article className={`sfr-player-card ${dayCellClass(slots)}`}>
      <div className="sfr-player-card-head">
        <ResponsivePlayerInline player={player} />
        {canEditCell ? (
          <button className="sfr-player-card-add" type="button" onClick={() => onAdd(day.value)} aria-label={`Add slot for ${player.name}`}>
            <Plus size={18} />
          </button>
        ) : null}
      </div>

      <div className="sfr-player-card-events">
        {slots.length ? (
          slots.map((slot) => (
            <MobileEventCard key={slot.id} event={slot} onEdit={onEdit} />
          ))
        ) : (
          <div className="sfr-player-card-empty">
            {canEditCell ? 'Tap + to add time' : 'No time selected'}
          </div>
        )}
      </div>
    </article>
  );
}
