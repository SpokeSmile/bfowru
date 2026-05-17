import AvailabilityBar from '../controls/AvailabilityBar.jsx';
import ControlsRow from '../controls/ControlsRow.jsx';
import ScheduleTable from '../table/ScheduleTable.jsx';
import ClockPanel from './ClockPanel.jsx';
import HeroPanel from './HeroPanel.jsx';
import ScheduleSidebar from './ScheduleSidebar.jsx';

export default function ScheduleDesktopPage({
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
  layout,
}) {
  const hasNotifications = false;

  return (
    <div className="sf-desktop-viewport" style={{ width: layout.width, height: layout.height }}>
      <div className="sf-desktop-frame" style={{ ...layout.style, transform: `scale(${layout.scale})` }}>
        <div className="sf-bg-base" />
        <div className="sf-bg-glow" />

        <div className="sf-desktop-layout">
          <div className="sf-sidebar-region">
            <ScheduleSidebar user={user} onFeedback={onFeedback} isFeedbackOpen={isFeedbackOpen} />
          </div>

          <div className="sf-content-region">
            <main className="sf-desktop-main" aria-label="Weekly roster">
              <div className="sf-topbar">
                <ClockPanel />
                <button className="sf-notice" type="button" aria-label="Notifications">
                  <img src="/static/img/schedule/icons/bell.png" alt="" />
                  {hasNotifications ? <span className="sf-notice-dot" /> : null}
                </button>
              </div>

              <HeroPanel />
              <ControlsRow
                selectedWeekStart={selectedWeekStart}
                canGoPreviousWeek={canGoPreviousWeek}
                canAdd={canAdd}
                hasPlayerProfile={hasPlayerProfile}
                canEditSelectedWeek={canEditSelectedWeek}
                days={days}
                slots={slots}
                dayEventTypes={dayEventTypes}
                players={players}
                onWeekChange={onWeekChange}
                onAdd={onAdd}
                onCopy={onCopy}
              />
              <ScheduleTable
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
            </main>

            <div className="sf-version">{appVersion || 'v0.0.0'}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
