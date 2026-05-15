import { useState } from 'react';

import AvailabilityBar from '../controls/AvailabilityBar.jsx';
import { ResponsiveActions, ResponsiveInfoCards, ResponsiveWeekSwitcher } from './ResponsiveControls.jsx';
import ResponsiveHero from './ResponsiveHero.jsx';
import ResponsiveScheduleTable from './ResponsiveScheduleTable.jsx';
import ResponsiveTopBar from './ResponsiveTopBar.jsx';
import ScheduleDrawer from './ScheduleDrawer.jsx';

export default function ScheduleCompactView({
  user,
  hasPlayerProfile,
  canAdd,
  canEditSelectedWeek,
  selectedWeekStart,
  canGoPreviousWeek,
  days,
  players,
  slots,
  dayEventTypes,
  onAdd,
  onEdit,
  onCopy,
  onWeekChange,
  onNoteHoverStart,
  onNoteHoverEnd,
  onFeedback,
  isFeedbackOpen,
}) {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  return (
    <div className="sfr-page sfr-page--compact">
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
          onAdd={onAdd}
          onCopy={onCopy}
        />
      </section>
      <ResponsiveInfoCards days={days} players={players} slots={slots} dayEventTypes={dayEventTypes} />
      <ResponsiveScheduleTable
        days={days}
        players={players}
        slots={slots}
        canEditSelectedWeek={canEditSelectedWeek}
        onAdd={onAdd}
        onEdit={onEdit}
        onNoteHoverStart={onNoteHoverStart}
        onNoteHoverEnd={onNoteHoverEnd}
      />
      <AvailabilityBar days={days} players={players} slots={slots} />
    </div>
  );
}
