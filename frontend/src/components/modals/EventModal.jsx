import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  CalendarDays,
  CalendarCheck2,
  CheckCircle2,
  ChevronRight,
  CircleHelp,
  Clock3,
  Eye,
  Plus,
  Trash2,
  XCircle,
} from 'lucide-react';

import { replaceDaySlots } from '../../api.js';
import { timeChoices } from '../../scheduleConfig.js';

const NOTE_LIMIT = 100;
const DEFAULT_START = 1140;
const DEFAULT_END = 1260;
const DAY_LABELS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];

const SLOT_TYPES = [
  {
    value: 'available',
    title: 'TIME RANGE',
    description: 'set custom time',
    icon: Clock3,
  },
  {
    value: 'full_day_available',
    title: 'ALL AVAILABLE',
    description: 'Available all day',
    icon: CheckCircle2,
  },
  {
    value: 'tentative',
    title: 'NOT SURE',
    description: 'Mark as uncertain',
    icon: CircleHelp,
  },
  {
    value: 'unavailable',
    title: 'I CANT',
    description: 'Not available',
    icon: XCircle,
  },
];
const INACTIVE_PREVIEW_TYPES = new Set(['tentative', 'unavailable']);

function clampMinutes(value) {
  return Math.max(0, Math.min(1440, value));
}

function formatHours(totalMinutes) {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

function minutesFromSlot(slot, key, fallback) {
  const value = slot?.[key];
  return Number.isFinite(value) ? value : fallback;
}

function buildEmptyState(dayOfWeek) {
  return {
    dayOfWeek,
    slotType: 'available',
    note: '',
    timeSlots: [{ startTimeMinutes: DEFAULT_START, endTimeMinutes: DEFAULT_END }],
  };
}

function stateFromDaySlots(dayOfWeek, daySlots) {
  if (!daySlots.length) return buildEmptyState(dayOfWeek);

  const statusSlot = daySlots.find((slot) => slot.slotType !== 'available');
  if (statusSlot) {
    return {
      dayOfWeek,
      slotType: statusSlot.slotType,
      note: statusSlot.note || '',
      timeSlots: [{ startTimeMinutes: DEFAULT_START, endTimeMinutes: DEFAULT_END }],
    };
  }

  return {
    dayOfWeek,
    slotType: 'available',
    note: daySlots[0]?.note || '',
    timeSlots: daySlots.map((slot) => ({
      startTimeMinutes: minutesFromSlot(slot, 'startTimeMinutes', DEFAULT_START),
      endTimeMinutes: minutesFromSlot(slot, 'endTimeMinutes', DEFAULT_END),
    })),
  };
}

function sortSlots(slots) {
  return [...slots].sort((left, right) => {
    const leftStart = left.startTimeMinutes ?? -1;
    const rightStart = right.startTimeMinutes ?? -1;
    return leftStart - rightStart || left.id - right.id;
  });
}

function overlapsHour(slot, hour) {
  const hourStart = hour * 60;
  const hourEnd = hourStart + 60;
  const start = clampMinutes(minutesFromSlot(slot, 'startTimeMinutes', 0));
  const end = clampMinutes(minutesFromSlot(slot, 'endTimeMinutes', 1440));
  return start < hourEnd && end > hourStart;
}

function buildTeamPrimeData({ slots, players, currentPlayerId, dayOfWeek }) {
  const playerIds = new Set(players.map((player) => player.id).filter((playerId) => playerId !== currentPlayerId));
  const hours = Array.from({ length: 24 }, (_unused, hour) => ({
    hour,
    available: new Set(),
    tentative: new Set(),
    unavailable: new Set(),
  }));

  slots.forEach((slot) => {
    if (slot.dayOfWeek !== dayOfWeek || !playerIds.has(slot.playerId)) return;

    if (slot.slotType === 'full_day_available') {
      hours.forEach((entry) => entry.available.add(slot.playerId));
      return;
    }

    if (slot.slotType === 'tentative') {
      hours.forEach((entry) => entry.tentative.add(slot.playerId));
      return;
    }

    if (slot.slotType === 'unavailable') {
      hours.forEach((entry) => entry.unavailable.add(slot.playerId));
      return;
    }

    if (slot.slotType === 'available') {
      hours.forEach((entry) => {
        if (overlapsHour(slot, entry.hour)) entry.available.add(slot.playerId);
      });
    }
  });

  const segments = hours.map((entry) => ({
    hour: entry.hour,
    available: entry.available.size,
    tentative: entry.tentative.size,
    unavailable: entry.unavailable.size,
  }));
  const maxAvailable = Math.max(0, ...segments.map((segment) => segment.available));
  const maxTentative = Math.max(0, ...segments.map((segment) => segment.tentative));
  const metricKey = maxAvailable > 0 ? 'available' : 'tentative';
  const targetCount = metricKey === 'available' ? maxAvailable : maxTentative;

  let bestWindow = null;
  if (targetCount > 0) {
    let runStart = null;
    let bestRun = null;

    segments.forEach((segment, index) => {
      const isMatch = segment[metricKey] === targetCount;
      if (isMatch && runStart === null) runStart = index;
      if ((!isMatch || index === segments.length - 1) && runStart !== null) {
        const runEnd = isMatch && index === segments.length - 1 ? index + 1 : index;
        const run = { start: runStart, end: runEnd, length: runEnd - runStart };
        if (!bestRun || run.length > bestRun.length) bestRun = run;
        runStart = null;
      }
    });

    const startSegment = segments[bestRun.start];
    bestWindow = {
      startHour: bestRun.start,
      endHour: bestRun.end,
      available: startSegment.available,
      tentative: startSegment.tentative,
      isTentativeOnly: metricKey === 'tentative',
    };
  }

  return {
    segments,
    bestWindow,
    totalPlayers: playerIds.size,
  };
}

function DayChip({ day, isSelected, onClick }) {
  return (
    <button className={`edit-time-day ${isSelected ? 'edit-time-day--active' : ''}`} type="button" onClick={onClick}>
      <span>{DAY_LABELS[day.value] || day.label.slice(0, 3).toUpperCase()}</span>
      <strong>{day.date.split('.')[0]}</strong>
    </button>
  );
}

function SelectBox({ value, options, onChange, ariaLabel }) {
  return (
    <label className="edit-time-select">
      <select aria-label={ariaLabel} value={value} onChange={(event) => onChange(Number(event.target.value))}>
        {options.map((choice) => (
          <option key={choice.value} value={choice.value}>
            {choice.label}
          </option>
        ))}
      </select>
      <ChevronRight size={16} />
    </label>
  );
}

function TimelinePreview({ slotType, timeSlots, teamPrime }) {
  const isInactivePreview = INACTIVE_PREVIEW_TYPES.has(slotType);
  const visibleSlots = slotType === 'available'
    ? timeSlots
    : [{ startTimeMinutes: 0, endTimeMinutes: 1440 }];
  const bestWindow = teamPrime.bestWindow;
  const bestWindowLabel = bestWindow
    ? `${formatHours(bestWindow.startHour * 60)}-${formatHours(bestWindow.endHour * 60)}`
    : 'No team data yet';
  const bestWindowMeta = bestWindow
    ? bestWindow.isTentativeOnly
      ? `${bestWindow.tentative}/${teamPrime.totalPlayers} not sure`
      : `${bestWindow.available}/${teamPrime.totalPlayers} available${bestWindow.tentative ? ` · ${bestWindow.tentative} not sure` : ''}`
    : 'Ask teammates to add time';

  return (
    <div className={`edit-time-preview ${isInactivePreview ? 'edit-time-preview--inactive' : ''}`}>
      <div className="edit-time-prime-header">
        <div>
          <span>{bestWindowMeta}</span>
        </div>
        <b>{bestWindowLabel}</b>
      </div>
      <div className="edit-time-preview-scale">
        {['00:00', '06:00', '12:00', '18:00', '00:00'].map((label) => (
          <span key={label}>{label}</span>
        ))}
      </div>
      <div className="edit-time-preview-track">
        <div className="edit-time-team-heatmap" aria-hidden="true">
          {teamPrime.segments.map((segment) => {
            const strongest = Math.max(segment.available, segment.tentative, segment.unavailable);
            const color = segment.available
              ? '13, 242, 158'
              : segment.tentative
                ? '245, 183, 89'
                : segment.unavailable
                  ? '255, 105, 116'
                  : '255, 255, 255';
            const alpha = strongest
              ? Math.min(0.72, 0.12 + (strongest / Math.max(1, teamPrime.totalPlayers)) * 0.56)
              : 0.035;
            return (
              <span
                className="edit-time-team-hour"
                key={segment.hour}
                style={{
                  '--team-hour-color': color,
                  '--team-hour-alpha': alpha,
                }}
                title={`${formatHours(segment.hour * 60)} · ${segment.available} available · ${segment.tentative} not sure`}
              />
            );
          })}
        </div>
        {[0, 1, 2, 3, 4].map((tick) => (
          <span className="edit-time-preview-tick" key={tick} />
        ))}
        {visibleSlots.map((slot, index) => {
          const start = Math.max(0, Math.min(1440, slot.startTimeMinutes));
          const end = Math.max(start + 60, Math.min(1440, slot.endTimeMinutes));
          const left = (start / 1440) * 100;
          const width = Math.min(100 - left, Math.max(8, ((end - start) / 1440) * 100));
          return (
            <span
              className={`edit-time-preview-bar edit-time-preview-bar--${slotType}`}
              key={`${slot.startTimeMinutes}-${slot.endTimeMinutes}-${index}`}
              style={{
                left: `${left}%`,
                top: `${index % 2 === 0 ? 72 : 108}px`,
                width: `${width}%`,
              }}
            />
          );
        })}
      </div>
    </div>
  );
}

function Summary({ slotType, timeSlots }) {
  const isInactivePreview = INACTIVE_PREVIEW_TYPES.has(slotType);
  const slotCount = isInactivePreview ? 0 : (slotType === 'available' ? timeSlots.length : 1);
  const totalMinutes = isInactivePreview
    ? 0
    : slotType === 'available'
      ? timeSlots.reduce((sum, slot) => sum + Math.max(0, slot.endTimeMinutes - slot.startTimeMinutes), 0)
      : 1440;

  return (
    <div className="edit-time-summary-values">
      <div>
        <strong>{slotCount}</strong>
        <span>TIME SLOTS</span>
      </div>
      <div>
        <strong>{formatHours(totalMinutes)}</strong>
        <span>TOTAL HOURS</span>
      </div>
    </div>
  );
}

export default function EventModal({
  event,
  day,
  days,
  players = [],
  slots = [],
  currentPlayerId,
  weekStart,
  onClose,
  onSaved,
}) {
  const startChoices = useMemo(() => timeChoices(0, 23), []);
  const endChoices = useMemo(() => timeChoices(1, 24), []);
  const selectedInitialDay = event?.dayOfWeek ?? day ?? days[0]?.value ?? 0;

  const slotsByDay = useMemo(() => {
    const grouped = new Map();
    slots
      .filter((slot) => slot.playerId === currentPlayerId)
      .forEach((slot) => {
        if (!grouped.has(slot.dayOfWeek)) grouped.set(slot.dayOfWeek, []);
        grouped.get(slot.dayOfWeek).push(slot);
      });
    grouped.forEach((daySlots, dayKey) => grouped.set(dayKey, sortSlots(daySlots)));
    return grouped;
  }, [currentPlayerId, slots]);

  const [formState, setFormState] = useState(() => stateFromDaySlots(
    selectedInitialDay,
    slotsByDay.get(selectedInitialDay) || [],
  ));
  const [errors, setErrors] = useState({});
  const [isSaving, setIsSaving] = useState(false);

  function loadDay(dayOfWeek) {
    setErrors({});
    setFormState(stateFromDaySlots(dayOfWeek, slotsByDay.get(dayOfWeek) || []));
  }

  function setSlotType(slotType) {
    setErrors({});
    setFormState((current) => ({
      ...current,
      slotType,
      timeSlots: current.timeSlots.length ? current.timeSlots : [{ startTimeMinutes: DEFAULT_START, endTimeMinutes: DEFAULT_END }],
    }));
  }

  function updateTimeSlot(index, key, value) {
    setFormState((current) => ({
      ...current,
      timeSlots: current.timeSlots.map((slot, slotIndex) => {
        if (slotIndex !== index) return slot;
        const nextSlot = { ...slot, [key]: value };
        if (key === 'startTimeMinutes' && nextSlot.endTimeMinutes <= value) {
          nextSlot.endTimeMinutes = Math.min(1440, value + 60);
        }
        if (key === 'endTimeMinutes' && value <= nextSlot.startTimeMinutes) {
          nextSlot.startTimeMinutes = Math.max(0, value - 60);
        }
        return nextSlot;
      }),
    }));
  }

  function addTimeSlot() {
    setFormState((current) => {
      const lastSlot = current.timeSlots[current.timeSlots.length - 1] || { endTimeMinutes: DEFAULT_START };
      const startTimeMinutes = Math.min(1380, lastSlot.endTimeMinutes);
      const endTimeMinutes = Math.min(1440, startTimeMinutes + 120);
      return {
        ...current,
        slotType: 'available',
        timeSlots: [...current.timeSlots, { startTimeMinutes, endTimeMinutes }],
      };
    });
  }

  function removeTimeSlot(index) {
    setFormState((current) => ({
      ...current,
      timeSlots: current.timeSlots.filter((_slot, slotIndex) => slotIndex !== index),
    }));
  }

  function updateNote(value) {
    setFormState((current) => ({
      ...current,
      note: Array.from(value).slice(0, NOTE_LIMIT).join(''),
    }));
  }

  async function submitReplacement(submitEvent) {
    submitEvent.preventDefault();
    setIsSaving(true);
    setErrors({});

    try {
      const response = await replaceDaySlots({
        weekStart: event?.weekStart || weekStart,
        dayOfWeek: formState.dayOfWeek,
        slotType: formState.slotType,
        note: formState.note,
        timeSlots: formState.slotType === 'available' ? formState.timeSlots : [],
      });
      onSaved(response);
    } catch (saveError) {
      setErrors(saveError.payload?.errors || { __all__: [saveError.message] });
    } finally {
      setIsSaving(false);
    }
  }

  async function removeDay() {
    setIsSaving(true);
    setErrors({});

    try {
      const response = await replaceDaySlots({
        weekStart: event?.weekStart || weekStart,
        dayOfWeek: formState.dayOfWeek,
        clear: true,
        note: '',
        timeSlots: [],
      });
      onSaved(response);
    } catch (deleteError) {
      setErrors(deleteError.payload?.errors || { __all__: [deleteError.message] });
    } finally {
      setIsSaving(false);
    }
  }

  const noteLength = Array.from(formState.note).length;
  const hasExistingDaySlots = Boolean((slotsByDay.get(formState.dayOfWeek) || []).length);
  const isInactivePreview = INACTIVE_PREVIEW_TYPES.has(formState.slotType);
  const teamPrime = useMemo(() => buildTeamPrimeData({
    slots,
    players,
    currentPlayerId,
    dayOfWeek: formState.dayOfWeek,
  }), [slots, players, currentPlayerId, formState.dayOfWeek]);

  return (
    <motion.div
      className="edit-time-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
    >
      <motion.form
        initial={{ opacity: 0, y: 24, scale: 0.5 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 24, scale: 0.5 }}
        transition={{ duration: 0.15, ease: [0.22, 1, 0.36, 1] }}
        className="edit-time-modal"
        onSubmit={submitReplacement}
      >
        <div className="edit-time-background" aria-hidden="true" />
        <div className="edit-time-glow" aria-hidden="true" />
        <h2 className="edit-time-title">
          <span>EDIT</span> TIME
        </h2>

        {errors.__all__ ? (
          <div className="edit-time-error">{errors.__all__.join(', ')}</div>
        ) : null}

        <div className="edit-time-types">
          {SLOT_TYPES.map((type) => {
            const Icon = type.icon;
            const isActive = formState.slotType === type.value;
            return (
              <button
                className={`edit-time-type ${isActive ? 'edit-time-type--active' : ''}`}
                key={type.value}
                type="button"
                onClick={() => setSlotType(type.value)}
              >
                <Icon size={38} strokeWidth={1.8} />
                <strong>{type.title}</strong>
                <span>{type.description}</span>
              </button>
            );
          })}
        </div>

        <div className="edit-time-main-grid">
          <section className="edit-time-left-panel">
            <div className="edit-time-section-label">
              <CalendarDays size={17} />
              <span>SELECT DAY</span>
            </div>

            <div className="edit-time-days">
              {days.map((dayOption) => (
                <DayChip
                  day={dayOption}
                  isSelected={formState.dayOfWeek === dayOption.value}
                  key={dayOption.value}
                  onClick={() => loadDay(dayOption.value)}
                />
              ))}
            </div>

            <div className="edit-time-section-label edit-time-section-label--slots">
              <Clock3 size={16} />
              <span>TIME SLOTS</span>
            </div>

            {formState.slotType === 'available' ? (
              <div className="edit-time-slots">
                {formState.timeSlots.map((timeSlot, index) => (
                  <div className="edit-time-slot-row" key={index}>
                    <SelectBox
                      ariaLabel={`Start time slot ${index + 1}`}
                      options={startChoices}
                      value={timeSlot.startTimeMinutes}
                      onChange={(value) => updateTimeSlot(index, 'startTimeMinutes', value)}
                    />
                    <span className="edit-time-slot-dash">-</span>
                    <SelectBox
                      ariaLabel={`End time slot ${index + 1}`}
                      options={endChoices}
                      value={timeSlot.endTimeMinutes}
                      onChange={(value) => updateTimeSlot(index, 'endTimeMinutes', value)}
                    />
                    <button
                      className="edit-time-slot-remove"
                      type="button"
                      disabled={isSaving}
                      onClick={() => removeTimeSlot(index)}
                      aria-label="Remove time slot"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                ))}

                <button className="edit-time-add-slot" type="button" onClick={addTimeSlot}>
                  <Plus size={16} />
                  ADD TIME SLOT
                </button>
              </div>
            ) : (
              <div className={`edit-time-status-preview edit-time-status-preview--${formState.slotType}`}>
                {SLOT_TYPES.find((type) => type.value === formState.slotType)?.title}
              </div>
            )}

            {errors.time_slots ? <div className="edit-time-field-error">{errors.time_slots.join(', ')}</div> : null}
            {errors.start_time_minutes ? <div className="edit-time-field-error">{errors.start_time_minutes.join(', ')}</div> : null}
            {errors.end_time_minutes ? <div className="edit-time-field-error">{errors.end_time_minutes.join(', ')}</div> : null}
          </section>

          <section className={`edit-time-right-panel ${isInactivePreview ? 'edit-time-right-panel--inactive' : ''}`}>
            <div className="edit-time-section-label">
              <Eye size={25} />
              <span>TEAM PRIME TIME</span>
            </div>
            <TimelinePreview slotType={formState.slotType} timeSlots={formState.timeSlots} teamPrime={teamPrime} />

            <div className="edit-time-section-label edit-time-section-label--summary">
              <CalendarCheck2 size={25} />
              <span>SUMMARY</span>
            </div>
            <Summary slotType={formState.slotType} timeSlots={formState.timeSlots} />
          </section>
        </div>

        <label className="edit-time-comment">
          <span>Comment (optional)</span>
          <strong>{noteLength}/{NOTE_LIMIT}</strong>
          <input
            maxLength={NOTE_LIMIT}
            placeholder="Additional information"
            value={formState.note}
            onChange={(event) => updateNote(event.target.value)}
          />
        </label>
        {errors.note ? <div className="edit-time-field-error edit-time-field-error--comment">{errors.note.join(', ')}</div> : null}

        <div className="edit-time-actions">
          <button
            className="edit-time-remove"
            type="button"
            disabled={isSaving || !hasExistingDaySlots}
            onClick={removeDay}
          >
            <Trash2 size={25} />
            Remove
          </button>

          <div className="edit-time-action-pair">
            <button className="edit-time-cancel" type="button" disabled={isSaving} onClick={onClose}>
              Cancel
            </button>
            <button className="edit-time-save" type="submit" disabled={isSaving}>
              Save
            </button>
          </div>
        </div>
      </motion.form>
    </motion.div>
  );
}
