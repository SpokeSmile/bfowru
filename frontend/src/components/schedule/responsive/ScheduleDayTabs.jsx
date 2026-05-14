import { DAY_NAMES } from '../constants.js';

export default function ScheduleDayTabs({ days, activeDay, onChange }) {
  return (
    <div className="sfr-day-tabs" role="tablist" aria-label="Week days">
      {days.map((day) => (
        <button
          className={`sfr-day-tab ${activeDay === day.value ? 'sfr-day-tab--active' : ''} ${day.isToday ? 'sfr-day-tab--today' : ''}`}
          type="button"
          key={day.value}
          onClick={() => onChange(day.value)}
          role="tab"
          aria-selected={activeDay === day.value}
        >
          <strong>{DAY_NAMES[day.value]?.slice(0, 3) || day.label}</strong>
          <span>{day.date}</span>
        </button>
      ))}
    </div>
  );
}
