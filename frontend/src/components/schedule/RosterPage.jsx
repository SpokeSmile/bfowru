import ScheduleDesktopPage from './desktop/ScheduleDesktopPage.jsx';
import { useScheduleLayout, useScheduleViewport } from './hooks/useScheduleViewport.js';
import { ScheduleCompactView, ScheduleMobileView } from './responsive/ScheduleResponsivePages.jsx';

export default function RosterPage({
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
  appVersion,
}) {
  const viewport = useScheduleViewport();
  const layout = useScheduleLayout();

  if (viewport.mode === 'mobile') {
    return (
      <ScheduleMobileView
        user={user}
        hasPlayerProfile={hasPlayerProfile}
        canAdd={canAdd}
        canEditSelectedWeek={canEditSelectedWeek}
        selectedWeekStart={selectedWeekStart}
        canGoPreviousWeek={canGoPreviousWeek}
        days={days}
        players={players}
        slots={slots}
        onAdd={onAdd}
        onEdit={onEdit}
        onCopy={onCopy}
        onWeekChange={onWeekChange}
        onFeedback={onFeedback}
        isFeedbackOpen={isFeedbackOpen}
      />
    );
  }

  if (viewport.mode === 'compact') {
    return (
      <ScheduleCompactView
        user={user}
        hasPlayerProfile={hasPlayerProfile}
        canAdd={canAdd}
        canEditSelectedWeek={canEditSelectedWeek}
        selectedWeekStart={selectedWeekStart}
        canGoPreviousWeek={canGoPreviousWeek}
        days={days}
        players={players}
        slots={slots}
        dayEventTypes={dayEventTypes}
        onAdd={onAdd}
        onEdit={onEdit}
        onCopy={onCopy}
        onWeekChange={onWeekChange}
        onNoteHoverStart={onNoteHoverStart}
        onNoteHoverEnd={onNoteHoverEnd}
        onFeedback={onFeedback}
        isFeedbackOpen={isFeedbackOpen}
      />
    );
  }

  return (
    <ScheduleDesktopPage
      user={user}
      hasPlayerProfile={hasPlayerProfile}
      canAdd={canAdd}
      canEditSelectedWeek={canEditSelectedWeek}
      selectedWeekStart={selectedWeekStart}
      canGoPreviousWeek={canGoPreviousWeek}
      days={days}
      players={players}
      slots={slots}
      dayEventTypes={dayEventTypes}
      onAdd={onAdd}
      onEdit={onEdit}
      onCopy={onCopy}
      onWeekChange={onWeekChange}
      onNoteHoverStart={onNoteHoverStart}
      onNoteHoverEnd={onNoteHoverEnd}
      onFeedback={onFeedback}
      isFeedbackOpen={isFeedbackOpen}
      appVersion={appVersion}
      layout={layout}
    />
  );
}
