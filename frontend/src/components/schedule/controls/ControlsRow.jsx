import { Copy, Plus } from 'lucide-react';

import { bestDaysByAvailability, buildUpcoming } from '../scheduleMetrics.js';
import { formatWeekRange, shiftWeek } from '../scheduleDate.js';

function IconBox({ className = '', children }) {
  return <span className={`sf-icon-box ${className}`}>{children}</span>;
}

export default function ControlsRow({
  selectedWeekStart,
  canGoPreviousWeek,
  canAdd,
  hasPlayerProfile,
  canEditSelectedWeek,
  days,
  slots,
  dayEventTypes,
  players,
  onWeekChange,
  onAdd,
  onCopy,
}) {
  const weekLabel = formatWeekRange(selectedWeekStart);
  const bestDays = bestDaysByAvailability(days, slots, players);
  const upcoming = buildUpcoming(days, slots, dayEventTypes);
  const canUsePlayerActions = hasPlayerProfile && canEditSelectedWeek;

  return (
    <section className="sf-controls-row" aria-label="Schedule controls">
      <section className="sf-control-card sf-date-card">
        <div className="sf-week-switcher">
          <button
            type="button"
            onClick={() => onWeekChange(shiftWeek(selectedWeekStart, -7))}
            disabled={!canGoPreviousWeek}
            aria-label="Previous week"
          >
            &lt;
          </button>
          <span>{weekLabel}</span>
          <button
            type="button"
            onClick={() => onWeekChange(shiftWeek(selectedWeekStart, 7))}
            aria-label="Next week"
          >
            &gt;
          </button>
        </div>
        <button
          className="sf-square-action sf-square-action--primary"
          type="button"
          onClick={() => onAdd(null)}
          disabled={!canUsePlayerActions || !canAdd}
          aria-label="Add time"
        >
          <Plus size={28} />
        </button>
        <button
          className="sf-square-action"
          type="button"
          onClick={onCopy}
          disabled={!hasPlayerProfile}
          aria-label="Copy schedule"
        >
          <Copy className="sf-copy-icon" size={28} />
        </button>
      </section>

      <section className="sf-control-card sf-best-card">
        <div className="sf-control-title">BEST DAY FOR GAME:</div>
        <IconBox className="sf-control-corner-icon">
          <img src="/static/img/schedule/icons/clock.png" alt="" />
        </IconBox>
        <div className="sf-chip-row">
          {bestDays.map((day) => (
            <span className="sf-chip" key={day.value}>{day.label}</span>
          ))}
        </div>
      </section>

      <section className="sf-control-card sf-upcoming-card">
        <div className="sf-control-title">UPCOMING:</div>
        <IconBox className="sf-control-corner-icon">
          <img src="/static/img/schedule/icons/trophy.png" alt="" />
        </IconBox>
        <div className="sf-chip-row">
          <span className="sf-chip">{upcoming.eventLabel}</span>
          <span className="sf-chip">{upcoming.dateLabel}</span>
          <span className="sf-chip">{upcoming.timeLabel}</span>
        </div>
      </section>
    </section>
  );
}
