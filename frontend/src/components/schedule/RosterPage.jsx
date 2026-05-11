import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, Check, Clock3, Copy, Plus } from 'lucide-react';

import { Avatar, RoleBadge } from '../common.jsx';
import { EVENT_STYLES, buildDayEventMap, previewNote } from '../../scheduleConfig.js';

const CANVAS_WIDTH = 1920;
const CANVAS_HEIGHT = 1080;
const DAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const MONTH_NAMES = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
const NAV_ITEMS = [
  { label: 'Schedule', href: '/', icon: 'schedule.png', active: true },
  { label: 'Roster', href: '/team/', icon: 'roster.png' },
  { label: 'Updates', href: '/updates/', icon: 'updates.png' },
  { label: 'Analytics', href: '/stats/', icon: 'analytics.png' },
  { label: 'Drafts', href: '', icon: 'drafts.png' },
  { label: 'Management', href: '/profile/', icon: 'management.png' },
];

const STATUS_META = {
  unavailable: {
    label: "I CAN'T",
    icon: AlertTriangle,
    className: 'sf-event-card--unavailable',
    cellClassName: 'sf-schedule-cell--unavailable',
  },
  full_day_available: {
    label: 'ALL AVAILABLE',
    icon: Check,
    className: 'sf-event-card--available-all',
    cellClassName: 'sf-schedule-cell--available',
  },
  tentative: {
    label: 'NOT SURE',
    icon: AlertTriangle,
    className: 'sf-event-card--tentative',
    cellClassName: 'sf-schedule-cell--tentative',
  },
};

function shiftWeek(weekStart, offsetDays) {
  const [year, month, day] = weekStart.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  date.setUTCDate(date.getUTCDate() + offsetDays);
  return date.toISOString().slice(0, 10);
}

function dateFromWeekStart(weekStart, offset = 0) {
  const [year, month, day] = weekStart.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  date.setUTCDate(date.getUTCDate() + offset);
  return date;
}

function formatWeekRange(weekStart) {
  if (!weekStart) return '';
  const start = dateFromWeekStart(weekStart, 0);
  const end = dateFromWeekStart(weekStart, 6);
  return `${String(start.getUTCDate()).padStart(2, '0')} ${MONTH_NAMES[start.getUTCMonth()]} - ${String(end.getUTCDate()).padStart(2, '0')} ${MONTH_NAMES[end.getUTCMonth()]}`;
}

function formatClock(timeZone) {
  const options = {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  };

  if (timeZone) {
    options.timeZone = timeZone;
  }

  return new Intl.DateTimeFormat('ru-RU', options).format(new Date());
}

function useClocks() {
  const [clocks, setClocks] = useState({
    utc: '--:--',
    local: '--:--',
    cet: '--:--',
  });

  useEffect(() => {
    const update = () => {
      setClocks({
        utc: formatClock('UTC'),
        local: formatClock(),
        cet: formatClock('Etc/GMT-1'),
      });
    };

    update();
    const timer = window.setInterval(update, 1000);
    return () => window.clearInterval(timer);
  }, []);

  return clocks;
}

function getViewportSize() {
  if (typeof window === 'undefined') {
    return { width: CANVAS_WIDTH, height: CANVAS_HEIGHT };
  }

  const viewport = window.visualViewport;
  const width = viewport?.width || document.documentElement.clientWidth || window.innerWidth;
  const height = viewport?.height || document.documentElement.clientHeight || window.innerHeight;

  return {
    width: Math.max(0, Math.floor(width)),
    height: Math.max(0, Math.floor(height)),
  };
}

function calculateLayout() {
  const viewport = getViewportSize();
  const rawScale = Math.min(viewport.width / CANVAS_WIDTH, viewport.height / CANVAS_HEIGHT, 1);
  const width = Math.min(viewport.width, Math.floor(CANVAS_WIDTH * rawScale));
  const height = Math.min(viewport.height, Math.floor(CANVAS_HEIGHT * rawScale));
  const scale = Math.min(width / CANVAS_WIDTH, height / CANVAS_HEIGHT, 1);

  return { width, height, scale };
}

function useScheduleLayout() {
  const [layout, setLayout] = useState(calculateLayout);

  useEffect(() => {
    const update = () => setLayout(calculateLayout());
    update();
    window.addEventListener('resize', update);
    window.visualViewport?.addEventListener('resize', update);

    return () => {
      window.removeEventListener('resize', update);
      window.visualViewport?.removeEventListener('resize', update);
    };
  }, []);

  return layout;
}

function bestDaysByAvailability(days, slots, players) {
  const playerIds = new Set(players.map((player) => player.id));
  const rankedDays = days.map((day) => {
    const availablePlayerIds = new Set();
    slots.forEach((slot) => {
      const isAvailable = slot.slotType === 'available' || slot.slotType === 'full_day_available';
      if (slot.dayOfWeek === day.value && isAvailable && playerIds.has(slot.playerId)) {
        availablePlayerIds.add(slot.playerId);
      }
    });
    return {
      ...day,
      score: availablePlayerIds.size,
      label: DAY_NAMES[day.value] || day.label,
    };
  });

  return rankedDays
    .sort((left, right) => right.score - left.score || left.value - right.value)
    .slice(0, 3);
}

function buildUpcoming(days, slots, dayEventTypes) {
  const nowDay = days.find((day) => day.isToday)?.value ?? 0;
  const dayEventMap = buildDayEventMap(dayEventTypes);
  const candidates = days
    .map((day) => {
      const dayEvent = dayEventMap.get(day.value);
      const daySlots = slots
        .filter((slot) => slot.dayOfWeek === day.value && slot.startTime)
        .sort((left, right) => left.startTimeMinutes - right.startTimeMinutes);

      if (!dayEvent?.eventType && !daySlots.length) return null;

      return {
        day,
        eventLabel: dayEvent?.eventLabel || 'Activity',
        dateLabel: day.date,
        timeLabel: daySlots[0]?.startTime || '--:--',
        order: day.value >= nowDay ? day.value - nowDay : day.value + 7 - nowDay,
      };
    })
    .filter(Boolean)
    .sort((left, right) => left.order - right.order);

  return candidates[0] || {
    eventLabel: 'No event',
    dateLabel: '--',
    timeLabel: '--:--',
  };
}

function availabilityByDay(days, players, slots) {
  const playerIds = new Set(players.map((player) => player.id));
  const totalPlayers = playerIds.size;

  return days.map((day) => {
    const availablePlayerIds = new Set();
    slots.forEach((slot) => {
      const isAvailable = slot.slotType === 'available' || slot.slotType === 'full_day_available';
      if (slot.dayOfWeek === day.value && isAvailable && playerIds.has(slot.playerId)) {
        availablePlayerIds.add(slot.playerId);
      }
    });

    const availableCount = availablePlayerIds.size;
    const ratio = totalPlayers ? availableCount / totalPlayers : 0;
    const tone = ratio >= 0.75 ? 'high' : ratio >= 0.5 ? 'mid' : 'low';
    return { ...day, availableCount, totalPlayers, ratio, tone };
  });
}

function dayCellClass(slots) {
  if (slots.some((slot) => slot.slotType === 'unavailable')) {
    return STATUS_META.unavailable.cellClassName;
  }
  if (slots.some((slot) => slot.slotType === 'tentative')) {
    return STATUS_META.tentative.cellClassName;
  }
  if (slots.some((slot) => slot.slotType === 'full_day_available')) {
    return STATUS_META.full_day_available.cellClassName;
  }
  return '';
}

function ClockPanel() {
  const clocks = useClocks();
  const entries = [
    ['UTC', clocks.utc],
    ['YOUR', clocks.local],
    ['CET', clocks.cet],
  ];

  return (
    <div className="sf-clock-panel">
      {entries.map(([label, value], index) => (
        <div className="sf-clock-card" key={label}>
          <div className="sf-clock-time">{value}</div>
          <div className="sf-clock-label">{label}</div>
          {index === 1 ? <span className="sf-clock-accent" /> : null}
        </div>
      ))}
    </div>
  );
}

function ScheduleSidebar({ user }) {
  return (
    <aside className="sf-sidebar">
      <div className="sf-sidebar-tile-mask" aria-hidden="true" />
      <div className="sf-sidebar-top">
        <img className="sf-sidebar-mark" src="/static/img/Logo.png" alt="" />
        <div className="sf-sidebar-brand">
          <span>MANAGE</span>
          <span>YOU TEAM</span>
        </div>
      </div>

      <div className="sf-team-logo-box">
        <span>TEAM</span>
        <span>LOGO</span>
      </div>

      <nav className="sf-nav" aria-label="Schedule navigation">
        {NAV_ITEMS.map((item) => {
          const content = (
            <>
              <img src={`/static/img/figma/schedule/icons/${item.icon}`} alt="" />
              <span>{item.label}</span>
            </>
          );

          if (!item.href) {
            return (
              <button className="sf-nav-item" type="button" disabled key={item.label}>
                {content}
              </button>
            );
          }

          return (
            <a className={`sf-nav-item ${item.active ? 'sf-nav-item--active' : ''}`} href={item.href} key={item.label}>
              {content}
            </a>
          );
        })}
      </nav>

      <a className="sf-sidebar-profile" href="/profile/" aria-label="Open profile">
        <Avatar src={user.avatarUrl} alt={user.username} fallbackLabel={user.username} className="sf-sidebar-avatar" />
        <div>
          <div className="sf-sidebar-profile-name">{user.username}</div>
          <div className="sf-sidebar-profile-subtitle">Team TWIK</div>
        </div>
        <span className="sf-sidebar-profile-arrow">⌃</span>
      </a>
    </aside>
  );
}

function HeroPanel() {
  return (
    <section className="sf-hero-panel">
      <div className="sf-hero-glow" />
      <h1>
        WEEKLY <span>ROSTER</span>
      </h1>
      <p>BLACK FLOCK</p>
    </section>
  );
}

function IconBox({ className = '', children }) {
  return <span className={`sf-icon-box ${className}`}>{children}</span>;
}

function ControlsRow({
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
    <>
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
          <Copy size={28} />
        </button>
      </section>

      <section className="sf-control-card sf-best-card">
        <div className="sf-control-title">BEST DAY FOR GAME:</div>
        <IconBox className="sf-control-corner-icon">
          <img src="/static/img/figma/schedule/icons/clock.png" alt="" />
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
          <img src="/static/img/figma/schedule/icons/trophy.png" alt="" />
        </IconBox>
        <div className="sf-chip-row">
          <span className="sf-chip">{upcoming.eventLabel}</span>
          <span className="sf-chip">{upcoming.dateLabel}</span>
          <span className="sf-chip">{upcoming.timeLabel}</span>
        </div>
      </section>
    </>
  );
}

function DayTypePill({ dayEvent }) {
  const hasDayType = Boolean(dayEvent?.eventType);
  const style = EVENT_STYLES[dayEvent?.eventType] || EVENT_STYLES.fallback;
  const Icon = hasDayType ? style.icon : Clock3;

  return (
    <span className={`sf-day-type ${hasDayType ? 'sf-day-type--active' : ''}`}>
      <Icon size={12} />
      {hasDayType ? dayEvent.eventLabel : 'No type'}
    </span>
  );
}

function PlayerCell({ player }) {
  return (
    <div className="sf-player-cell">
      <Avatar src={player.avatarUrl} alt={player.name} fallbackLabel={player.name} className="sf-player-avatar" />
      <div className="sf-player-copy">
        <div className="sf-player-name">{player.name}</div>
        <RoleBadge role={player.role} color={player.roleColor} className="sf-player-role" />
      </div>
    </div>
  );
}

function EventCard({ event, onEdit, onNoteHoverStart, onNoteHoverEnd }) {
  const statusMeta = STATUS_META[event.slotType];
  const isAllDayStatus = Boolean(statusMeta);
  const eventStyle = EVENT_STYLES[event.eventType] || EVENT_STYLES.fallback;
  const Icon = statusMeta?.icon || eventStyle.icon || Clock3;
  const className = statusMeta?.className || 'sf-event-card--time';
  const editableProps = event.canEdit
    ? {
        role: 'button',
        tabIndex: 0,
        'aria-label': 'Edit schedule slot',
        onClick: () => onEdit(event),
        onKeyDown: (keyboardEvent) => {
          if (keyboardEvent.key === 'Enter' || keyboardEvent.key === ' ') {
            keyboardEvent.preventDefault();
            onEdit(event);
          }
        },
      }
    : {};

  return (
    <motion.article
      whileHover={{ y: -1 }}
      className={`sf-event-card ${className} ${event.canEdit ? 'sf-event-card--editable' : ''}`}
      onMouseEnter={(mouseEvent) => {
        if (event.note) {
          onNoteHoverStart(event.note, mouseEvent.currentTarget.getBoundingClientRect());
        }
      }}
      onMouseLeave={() => {
        if (event.note) {
          onNoteHoverEnd();
        }
      }}
      {...editableProps}
    >
      <Icon size={14} />
      <span className="sf-event-main">{isAllDayStatus ? statusMeta.label : event.timeRange}</span>
      {event.note ? <span className="sf-event-note">{previewNote(event.note)}</span> : null}
    </motion.article>
  );
}

function ScheduleTable({
  days,
  players,
  slots,
  dayEventTypes,
  canEditSelectedWeek,
  onAdd,
  onEdit,
  onNoteHoverStart,
  onNoteHoverEnd,
}) {
  const dayEventMap = useMemo(() => buildDayEventMap(dayEventTypes), [dayEventTypes]);
  const slotsByCell = useMemo(() => {
    const grouped = new Map();
    slots.forEach((slot) => {
      const key = `${slot.playerId}:${slot.dayOfWeek}`;
      if (!grouped.has(key)) grouped.set(key, []);
      grouped.get(key).push(slot);
    });
    return grouped;
  }, [slots]);

  return (
    <section className="sf-schedule-table">
      <div className="sf-table-header">
        <div className="sf-table-header-cell sf-table-header-cell--players">Players</div>
        {days.map((day) => {
          const label = DAY_NAMES[day.value] || day.label;
          return (
            <div className={`sf-table-header-cell ${day.isToday ? 'sf-table-header-cell--today' : ''}`} key={day.value}>
              <span className="sf-day-name">{label}</span>
              <span className="sf-day-date">{day.date}</span>
              <DayTypePill dayEvent={dayEventMap.get(day.value)} />
            </div>
          );
        })}
      </div>

      <div className="sf-table-body">
        {players.map((player) => (
          <div className="sf-table-row" key={player.id}>
            <PlayerCell player={player} />
            {days.map((day) => {
              const cellSlots = slotsByCell.get(`${player.id}:${day.value}`) || [];
              const canEditCell = player.canEdit && canEditSelectedWeek;
              return (
                <div className={`sf-schedule-cell ${dayCellClass(cellSlots)}`} key={`${player.id}-${day.value}`}>
                  {cellSlots.length ? (
                    <div className="sf-cell-events">
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
                        <button className="sf-cell-add sf-cell-add--compact" type="button" onClick={() => onAdd(day.value)}>
                          +
                        </button>
                      ) : null}
                    </div>
                  ) : canEditCell ? (
                    <button className="sf-cell-add" type="button" onClick={() => onAdd(day.value)} aria-label={`Add slot for ${day.label}`}>
                      +
                    </button>
                  ) : (
                    <span className="sf-cell-add sf-cell-add--disabled">+</span>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </section>
  );
}

function AvailabilityBar({ days, players, slots }) {
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
}) {
  const layout = useScheduleLayout();

  return (
    <div className="sf-viewport" style={{ width: layout.width, height: layout.height }}>
      <div className="sf-canvas" style={{ transform: `scale(${layout.scale})` }}>
        <div className="sf-bg-base" />
        <div className="sf-bg-glow" />

        <ScheduleSidebar user={user} />
        <ClockPanel />
        <button className="sf-notice" type="button" aria-label="Notifications">
          <img src="/static/img/figma/schedule/icons/bell.png" alt="" />
          <span />
        </button>

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
          dayEventTypes={dayEventTypes}
          canEditSelectedWeek={canEditSelectedWeek}
          onAdd={onAdd}
          onEdit={onEdit}
          onNoteHoverStart={onNoteHoverStart}
          onNoteHoverEnd={onNoteHoverEnd}
        />
        <AvailabilityBar days={days} players={players} slots={slots} />
        <div className="sf-version">v2.0</div>
      </div>
    </div>
  );
}
