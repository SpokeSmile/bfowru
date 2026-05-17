import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  CircleHelp,
  ClipboardList,
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

function TimelinePreview({ slotType, timeSlots }) {
  const isInactivePreview = INACTIVE_PREVIEW_TYPES.has(slotType);
  const visibleSlots = isInactivePreview
    ? []
    : slotType === 'available'
      ? timeSlots
      : [{ startTimeMinutes: 0, endTimeMinutes: 1440 }];

  return (
    <div className={`edit-time-preview ${isInactivePreview ? 'edit-time-preview--inactive' : ''}`}>
      <div className="edit-time-preview-scale">
        {['00:00', '06:00', '12:00', '18:00', '00:00'].map((label) => (
          <span key={label}>{label}</span>
        ))}
      </div>
      <div className="edit-time-preview-track">
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
              className="edit-time-preview-bar"
              key={`${slot.startTimeMinutes}-${slot.endTimeMinutes}-${index}`}
              style={{
                left: `${left}%`,
                top: `${index % 2 === 0 ? 22 : 102}px`,
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
              <span>VISUAL PREVIEW</span>
            </div>
            <TimelinePreview slotType={formState.slotType} timeSlots={formState.timeSlots} />

            <div className="edit-time-section-label edit-time-section-label--summary">
              <ClipboardList size={25} />
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
