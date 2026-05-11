import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Clock3, Copy, Menu, Plus, X } from 'lucide-react';

import { Avatar, RoleBadge } from '../common.jsx';
import { buildDayEventMap, previewNote } from '../../scheduleConfig.js';

const CANVAS_WIDTH = 1920;
const CANVAS_HEIGHT = 1080;
const MAIN_LEFT = 366;
const MAIN_RIGHT = 154;
const MAIN_WIDTH = 1400;
const CONTROL_GAP = 32;
const DATE_CARD_WIDTH = 540;
const BEST_CARD_WIDTH = 392;
const UPCOMING_CARD_WIDTH = 404;
const CONTROL_CONTENT_WIDTH = DATE_CARD_WIDTH + BEST_CARD_WIDTH + UPCOMING_CARD_WIDTH;
const DAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const MONTH_NAMES = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
const DESKTOP_CANVAS_MIN_WIDTH = 1440;
const MOBILE_MAX_WIDTH = 767;
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
    className: 'sf-event-card--unavailable',
    cellClassName: 'sf-schedule-cell--unavailable',
  },
  full_day_available: {
    label: 'ALL AVAILABLE',
    className: 'sf-event-card--available-all',
    cellClassName: 'sf-schedule-cell--available',
  },
  tentative: {
    label: 'NOT SURE',
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
        cet: formatClock('Europe/Berlin'),
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
  const scale = Math.max(0.01, Math.min(viewport.width / CANVAS_WIDTH, viewport.height / CANVAS_HEIGHT));
  const canvasWidth = Math.max(CANVAS_WIDTH, viewport.width / scale);
  const extraWidth = canvasWidth - CANVAS_WIDTH;
  const mainWidth = MAIN_WIDTH + extraWidth;
  const controlWidth = mainWidth - CONTROL_GAP * 2;
  const dateWidth = controlWidth * (DATE_CARD_WIDTH / CONTROL_CONTENT_WIDTH);
  const bestWidth = controlWidth * (BEST_CARD_WIDTH / CONTROL_CONTENT_WIDTH);
  const upcomingWidth = controlWidth * (UPCOMING_CARD_WIDTH / CONTROL_CONTENT_WIDTH);

  return {
    width: viewport.width,
    height: Math.min(viewport.height, CANVAS_HEIGHT * scale),
    scale,
    style: {
      '--sf-canvas-width': `${canvasWidth}px`,
      '--sf-main-left': `${MAIN_LEFT}px`,
      '--sf-main-right': `${MAIN_RIGHT}px`,
      '--sf-main-width': `${mainWidth}px`,
      '--sf-date-width': `${dateWidth}px`,
      '--sf-best-width': `${bestWidth}px`,
      '--sf-upcoming-width': `${upcomingWidth}px`,
      '--sf-best-left': `${MAIN_LEFT + dateWidth + CONTROL_GAP}px`,
      '--sf-upcoming-left': `${MAIN_LEFT + dateWidth + CONTROL_GAP + bestWidth + CONTROL_GAP}px`,
      '--sf-clock-left': `${MAIN_LEFT + (mainWidth - 380) / 2}px`,
      '--sf-notice-left': `${MAIN_LEFT + mainWidth - 60}px`,
      '--sf-version-left': `${canvasWidth - 94}px`,
    },
  };
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

function viewportMode(width) {
  if (width >= DESKTOP_CANVAS_MIN_WIDTH) return 'desktopCanvas';
  if (width <= MOBILE_MAX_WIDTH) return 'mobile';
  return 'compact';
}

function useScheduleViewport() {
  const [viewport, setViewport] = useState(() => {
    const size = getViewportSize();
    return { ...size, mode: viewportMode(size.width) };
  });

  useEffect(() => {
    const update = () => {
      const size = getViewportSize();
      setViewport({ ...size, mode: viewportMode(size.width) });
    };

    update();
    window.addEventListener('resize', update);
    window.visualViewport?.addEventListener('resize', update);

    return () => {
      window.removeEventListener('resize', update);
      window.visualViewport?.removeEventListener('resize', update);
    };
  }, []);

  return viewport;
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
      <div className="sf-sidebar-top">
        <img className="sf-sidebar-mark" src="/static/img/logo1.png" alt="" />
        <div className="sf-sidebar-brand">
          <span>MANAGE</span>
          <span>
            YOU <b>TEAM</b>
          </span>
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
        <span className="sf-sidebar-profile-arrow">&gt;</span>
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
          <Copy className="sf-copy-icon" size={28} />
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
      <span className="sf-event-main">{isAllDayStatus ? statusMeta.label : event.timeRange}</span>
      {event.note ? <span className="sf-event-note">{previewNote(event.note)}</span> : null}
    </motion.article>
  );
}

function ScheduleTable({
  days,
  players,
  slots,
  canEditSelectedWeek,
  onAdd,
  onEdit,
  onNoteHoverStart,
  onNoteHoverEnd,
}) {
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

function useSlotsByCell(slots) {
  return useMemo(() => {
    const grouped = new Map();
    slots.forEach((slot) => {
      const key = `${slot.playerId}:${slot.dayOfWeek}`;
      if (!grouped.has(key)) grouped.set(key, []);
      grouped.get(key).push(slot);
    });
    grouped.forEach((cellSlots) => {
      cellSlots.sort((left, right) => (left.startTimeMinutes ?? -1) - (right.startTimeMinutes ?? -1));
    });
    return grouped;
  }, [slots]);
}

function ScheduleDrawer({ user, isOpen, onClose }) {
  useEffect(() => {
    if (!isOpen) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  return (
    <div className={`sfr-drawer-layer ${isOpen ? 'sfr-drawer-layer--open' : ''}`} aria-hidden={!isOpen}>
      <button className="sfr-drawer-backdrop" type="button" onClick={onClose} aria-label="Close navigation" />
      <aside className="sfr-drawer" aria-label="Schedule navigation">
        <div className="sfr-drawer-head">
          <img src="/static/img/Logo.png" alt="" />
          <div>
            <strong>BLACK FLOCK</strong>
            <span>TEAM HUB</span>
          </div>
          <button type="button" onClick={onClose} aria-label="Close navigation">
            <X size={20} />
          </button>
        </div>

        <nav className="sfr-drawer-nav">
          {NAV_ITEMS.map((item) => {
            const content = (
              <>
                <img src={`/static/img/figma/schedule/icons/${item.icon}`} alt="" />
                <span>{item.label}</span>
              </>
            );

            if (!item.href) {
              return (
                <button className="sfr-drawer-nav-item" type="button" disabled key={item.label}>
                  {content}
                </button>
              );
            }

            return (
              <a
                className={`sfr-drawer-nav-item ${item.active ? 'sfr-drawer-nav-item--active' : ''}`}
                href={item.href}
                key={item.label}
                onClick={onClose}
              >
                {content}
              </a>
            );
          })}
        </nav>

        <a className="sfr-drawer-profile" href="/profile/" onClick={onClose}>
          <Avatar src={user.avatarUrl} alt={user.username} fallbackLabel={user.username} className="sfr-drawer-avatar" />
          <div>
            <strong>{user.username}</strong>
            <span>Open profile</span>
          </div>
        </a>
      </aside>
    </div>
  );
}

function ResponsiveClockStrip() {
  const clocks = useClocks();
  const entries = [
    ['UTC', clocks.utc],
    ['YOUR', clocks.local],
    ['CET', clocks.cet],
  ];

  return (
    <div className="sfr-clocks" aria-label="World clocks">
      {entries.map(([label, value]) => (
        <div className={`sfr-clock ${label === 'YOUR' ? 'sfr-clock--active' : ''}`} key={label}>
          <span>{label}</span>
          <strong>{value}</strong>
          {label === 'YOUR' ? <i className="sfr-clock-accent" aria-hidden="true" /> : null}
        </div>
      ))}
    </div>
  );
}

function ResponsiveTopBar({ user, onMenuOpen }) {
  return (
    <header className="sfr-topbar">
      <button className="sfr-menu-button" type="button" onClick={onMenuOpen} aria-label="Open navigation">
        <Menu size={22} />
      </button>
      <a className="sfr-brand" href="/">
        <img src="/static/img/Logo.png" alt="" />
        <span>BLACK FLOCK</span>
      </a>
      <ResponsiveClockStrip />
      <a className="sfr-user" href="/profile/">
        <Avatar src={user.avatarUrl} alt={user.username} fallbackLabel={user.username} className="sfr-user-avatar" />
        <span>{user.username}</span>
      </a>
    </header>
  );
}

function ResponsiveHero() {
  return (
    <section className="sfr-hero">
      <div>
        <span>BLACK FLOCK</span>
        <h1>WEEKLY ROSTER</h1>
      </div>
    </section>
  );
}

function ResponsiveWeekSwitcher({ selectedWeekStart, canGoPreviousWeek, onWeekChange }) {
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

function ResponsiveActions({ canAdd, hasPlayerProfile, canEditSelectedWeek, onAdd, onCopy, selectedDay = null }) {
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

function ResponsiveInfoCards({ days, players, slots, dayEventTypes }) {
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

function ResponsivePlayerInline({ player }) {
  return (
    <div className="sfr-player-inline">
      <Avatar src={player.avatarUrl} alt={player.name} fallbackLabel={player.name} className="sfr-player-avatar" />
      <div>
        <strong>{player.name}</strong>
        <RoleBadge role={player.role} color={player.roleColor} className="sfr-player-role" />
      </div>
    </div>
  );
}

function ResponsiveScheduleTable({
  days,
  players,
  slots,
  canEditSelectedWeek,
  onAdd,
  onEdit,
  onNoteHoverStart,
  onNoteHoverEnd,
}) {
  const slotsByCell = useSlotsByCell(slots);

  return (
    <section className="sfr-table-card">
      <div className="sfr-table-scroll">
        <div className="sfr-table">
          <div className="sfr-table-head sfr-table-row">
            <div className="sfr-table-head-cell sfr-table-head-cell--players">Players</div>
            {days.map((day) => (
              <div className={`sfr-table-head-cell ${day.isToday ? 'sfr-table-head-cell--today' : ''}`} key={day.value}>
                <strong>{DAY_NAMES[day.value] || day.label}</strong>
                <span>{day.date}</span>
              </div>
            ))}
          </div>

          {players.map((player) => (
            <div className="sfr-table-row" key={player.id}>
              <div className="sfr-table-player-cell">
                <ResponsivePlayerInline player={player} />
              </div>
              {days.map((day) => {
                const cellSlots = slotsByCell.get(`${player.id}:${day.value}`) || [];
                const canEditCell = player.canEdit && canEditSelectedWeek;
                return (
                  <div className={`sfr-table-cell ${dayCellClass(cellSlots)}`} key={`${player.id}-${day.value}`}>
                    {cellSlots.length ? (
                      <div className="sfr-cell-events">
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
                          <button className="sfr-add-compact" type="button" onClick={() => onAdd(day.value)}>
                            +
                          </button>
                        ) : null}
                      </div>
                    ) : canEditCell ? (
                      <button className="sfr-add-empty" type="button" onClick={() => onAdd(day.value)} aria-label={`Add slot for ${day.label}`}>
                        +
                      </button>
                    ) : (
                      <span className="sfr-add-empty sfr-add-empty--disabled">+</span>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function ScheduleDayTabs({ days, activeDay, onChange }) {
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

function SchedulePlayerCard({ player, day, slots, canEditSelectedWeek, onAdd, onEdit }) {
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

function ScheduleMobileView({
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
      <ScheduleDrawer user={user} isOpen={isDrawerOpen} onClose={() => setIsDrawerOpen(false)} />
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

function ScheduleCompactView({
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
  appVersion,
  onAdd,
  onEdit,
  onCopy,
  onWeekChange,
  onNoteHoverStart,
  onNoteHoverEnd,
}) {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  return (
    <div className="sfr-page sfr-page--compact">
      <ResponsiveTopBar user={user} onMenuOpen={() => setIsDrawerOpen(true)} />
      <ScheduleDrawer user={user} isOpen={isDrawerOpen} onClose={() => setIsDrawerOpen(false)} />
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
  const viewport = useScheduleViewport();
  const layout = useScheduleLayout();
  const hasNotifications = false;

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
      />
    );
  }

  return (
    <div className="sf-viewport" style={{ width: layout.width, height: layout.height }}>
      <div className="sf-canvas" style={{ ...layout.style, transform: `scale(${layout.scale})` }}>
        <div className="sf-bg-base" />
        <div className="sf-bg-glow" />

        <ScheduleSidebar user={user} />
        <ClockPanel />
        <button className="sf-notice" type="button" aria-label="Notifications">
          <img src="/static/img/figma/schedule/icons/bell.png" alt="" />
          {hasNotifications ? <span className="sf-notice-dot" /> : null}
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
          canEditSelectedWeek={canEditSelectedWeek}
          onAdd={onAdd}
          onEdit={onEdit}
          onNoteHoverStart={onNoteHoverStart}
          onNoteHoverEnd={onNoteHoverEnd}
        />
        <AvailabilityBar days={days} players={players} slots={slots} />
        <div className="sf-version">V{__APP_VERSION__ || '0.0.0'}</div>
      </div>
    </div>
  );
}
