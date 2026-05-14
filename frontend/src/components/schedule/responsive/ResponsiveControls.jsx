import { Clock3, Copy, Plus } from 'lucide-react';

import { formatWeekRange, shiftWeek } from '../scheduleDate.js';
import { bestDaysByAvailability, buildUpcoming } from '../scheduleMetrics.js';

export function ResponsiveWeekSwitcher({ selectedWeekStart, canGoPreviousWeek, onWeekChange }) {
  return (
    <div className="sfr-week-switcher">
      <button
        type="button"
        onClick={() => onWeekChange(shiftWeek(selectedWeekStart, -7))}
        disabled={!canGoPreviousWeek}
        aria-label="Previous week"
      >
        &lt;
      </button>
      <span>{formatWeekRange(selectedWeekStart)}</span>
      <button
        type="button"
        onClick={() => onWeekChange(shiftWeek(selectedWeekStart, 7))}
        aria-label="Next week"
      >
        &gt;
      </button>
    </div>
  );
}

export function ResponsiveActions({ canAdd, hasPlayerProfile, canEditSelectedWeek, onAdd, onCopy, selectedDay = null }) {
  const canUsePlayerActions = hasPlayerProfile && canEditSelectedWeek;

  return (
    <div className="sfr-actions">
      <button
        className="sfr-action sfr-action--primary"
        type="button"
        onClick={() => onAdd(selectedDay)}
        disabled={!canUsePlayerActions || !canAdd}
      >
        <Plus size={20} />
        <span>Add time</span>
      </button>
      <button
        className="sfr-action"
        type="button"
        onClick={onCopy}
        disabled={!hasPlayerProfile}
      >
        <Copy className="sfr-copy-icon" size={20} />
        <span>Copy schedule</span>
      </button>
    </div>
  );
}

export function ResponsiveInfoCards({ days, players, slots, dayEventTypes }) {
  const bestDays = bestDaysByAvailability(days, slots, players);
  const upcoming = buildUpcoming(days, slots, dayEventTypes);

  return (
    <section className="sfr-info-grid">
      <article className="sfr-info-card">
        <div>
          <span>BEST DAY FOR GAME</span>
          <strong>{bestDays.map((day) => day.label).join(' / ') || '—'}</strong>
        </div>
        <Clock3 size={22} />
      </article>
      <article className="sfr-info-card">
        <div>
          <span>UPCOMING</span>
          <strong>{upcoming.eventLabel}</strong>
          <small>{upcoming.dateLabel} · {upcoming.timeLabel}</small>
        </div>
        <img src="/static/img/figma/schedule/icons/trophy.png" alt="" />
      </article>
    </section>
  );
}
