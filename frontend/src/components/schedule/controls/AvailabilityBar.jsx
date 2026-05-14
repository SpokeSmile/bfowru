import { useMemo } from 'react';

import { availabilityByDay } from '../scheduleMetrics.js';

export default function AvailabilityBar({ days, players, slots }) {
  const availability = useMemo(() => availabilityByDay(days, players, slots), [days, players, slots]);

  return (
    <section className="sf-availability">
      <div className="sf-availability-title">
        <span>AVAILABILITY</span>
        <small>PLAYERS</small>
      </div>
      {availability.map((day) => {
        const width = day.totalPlayers ? `${Math.max(day.ratio * 100, day.availableCount ? 8 : 0)}%` : '0%';
        return (
          <div className={`sf-availability-day sf-availability-day--${day.tone}`} key={day.value}>
            <div className="sf-availability-track">
              <span style={{ width }} />
            </div>
            <div className="sf-availability-count">{day.availableCount}/{day.totalPlayers}</div>
          </div>
        );
      })}
    </section>
  );
}
