import { useEffect, useState } from 'react';

import useSlotsByCell from '../hooks/useSlotsByCell.js';
import { ResponsiveActions, ResponsiveWeekSwitcher } from './ResponsiveControls.jsx';
import ResponsiveHero from './ResponsiveHero.jsx';
import ResponsiveTopBar from './ResponsiveTopBar.jsx';
import ScheduleDayTabs from './ScheduleDayTabs.jsx';
import ScheduleDrawer from './ScheduleDrawer.jsx';
import SchedulePlayerCard from './SchedulePlayerCard.jsx';

export default function ScheduleMobileView({
  user,
  hasPlayerProfile,
  canAdd,
  canEditSelectedWeek,
  selectedWeekStart,
  canGoPreviousWeek,
  days,
  players,
  slots,
  onAdd,
  onEdit,
  onCopy,
  onWeekChange,
  onFeedback,
  isFeedbackOpen,
}) {
  const initialDay = days.find((day) => day.isToday)?.value ?? days[0]?.value ?? 0;
  const [activeDay, setActiveDay] = useState(initialDay);
  const slotsByCell = useSlotsByCell(slots);
  const activeDayData = days.find((day) => day.value === activeDay) || days[0];
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  useEffect(() => {
    const nextDay = days.find((day) => day.value === activeDay)?.value
      ?? days.find((day) => day.isToday)?.value
      ?? days[0]?.value
      ?? 0;
    setActiveDay(nextDay);
  }, [activeDay, days]);

  return (
    <div className="sfr-page sfr-page--mobile">
      <ResponsiveTopBar user={user} onMenuOpen={() => setIsDrawerOpen(true)} />
      <ScheduleDrawer
        user={user}
        isOpen={isDrawerOpen}
        isFeedbackOpen={isFeedbackOpen}
        onClose={() => setIsDrawerOpen(false)}
        onFeedback={onFeedback}
      />
      <ResponsiveHero />
      <section className="sfr-controls">
        <ResponsiveWeekSwitcher
          selectedWeekStart={selectedWeekStart}
          canGoPreviousWeek={canGoPreviousWeek}
          onWeekChange={onWeekChange}
        />
        <ResponsiveActions
          canAdd={canAdd}
          hasPlayerProfile={hasPlayerProfile}
          canEditSelectedWeek={canEditSelectedWeek}
          selectedDay={activeDay}
          onAdd={onAdd}
          onCopy={onCopy}
        />
      </section>
      <ScheduleDayTabs
        days={days}
        activeDay={activeDay}
        onChange={setActiveDay}
      />
      <section className="sfr-mobile-list" aria-label={activeDayData?.label || 'Selected day'}>
        {players.map((player) => (
          <SchedulePlayerCard
            key={player.id}
            player={player}
            day={activeDayData}
            slots={slotsByCell.get(`${player.id}:${activeDay}`) || []}
            canEditSelectedWeek={canEditSelectedWeek}
            onAdd={onAdd}
            onEdit={onEdit}
          />
        ))}
      </section>
    </div>
  );
}
