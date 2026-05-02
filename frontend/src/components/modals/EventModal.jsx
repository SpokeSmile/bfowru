import { useState } from 'react';
import { motion } from 'framer-motion';
import { Save, Trash2, X } from 'lucide-react';

import { createSlot, deleteSlot, updateSlot } from '../../api.js';
import { timeChoices } from '../../scheduleConfig.js';

export default function EventModal({ event, day, days, onClose, onSaved, onDeleted }) {
  const isEditing = Boolean(event);
  const [slotType, setSlotType] = useState(event?.slotType || 'available');
  const [dayOfWeek, setDayOfWeek] = useState(event?.dayOfWeek ?? day ?? days[0]?.value ?? 0);
  const [startTimeMinutes, setStartTimeMinutes] = useState(event?.startTimeMinutes ?? 1140);
  const [endTimeMinutes, setEndTimeMinutes] = useState(event?.endTimeMinutes ?? 1260);
  const [note, setNote] = useState(event?.note || '');
  const [errors, setErrors] = useState({});
  const [isSaving, setIsSaving] = useState(false);

  async function handleSubmit(submitEvent) {
    submitEvent.preventDefault();
    setIsSaving(true);
    setErrors({});

    const payload = {
      slotType,
      dayOfWeek,
      startTimeMinutes,
      endTimeMinutes,
      note,
    };

    if (slotType === 'unavailable' || slotType === 'full_day_available' || slotType === 'tentative') {
      payload.startTimeMinutes = null;
      payload.endTimeMinutes = null;
    }

    try {
      const response = isEditing ? await updateSlot(event.id, payload) : await createSlot(payload);
      onSaved(response.slot);
    } catch (saveError) {
      setErrors(saveError.payload?.errors || { __all__: [saveError.message] });
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete() {
    if (!isEditing) return;
    setIsSaving(true);
    try {
      await deleteSlot(event.id);
      onDeleted(event.id);
    } catch (deleteError) {
      setErrors(deleteError.payload?.errors || { __all__: [deleteError.message] });
    } finally {
      setIsSaving(false);
    }
  }

  const startChoices = timeChoices(0, 23);
  const endChoices = timeChoices(1, 24);

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4 backdrop-blur-sm">
      <motion.form
        initial={{ opacity: 0, y: 24, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        className="w-full max-w-2xl rounded-xl border border-bf-cream/12 bg-[#0d1420] p-6 shadow-panel"
        onSubmit={handleSubmit}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-sm font-black uppercase text-bf-orange">Availability editor</div>
            <h2 className="mt-1 text-2xl font-black uppercase text-slate-100">
              {isEditing ? 'Редактировать время' : 'Добавить время'}
            </h2>
          </div>
          <button
            className="rounded-xl border border-bf-cream/10 p-2 text-bf-cream/60 transition hover:border-bf-orange/40 hover:text-bf-orange"
            type="button"
            onClick={onClose}
            aria-label="Закрыть"
          >
            <X size={20} />
          </button>
        </div>

        {errors.__all__ ? (
          <div className="mt-4 rounded-xl border border-red-400/30 bg-red-500/10 p-3 text-sm text-red-100">
            {errors.__all__.join(', ')}
          </div>
        ) : null}

        <div className="mt-6 grid gap-5">
          <div className="grid grid-cols-4 gap-3 max-lg:grid-cols-2 max-md:grid-cols-1">
            <button
              className={`rounded-xl border px-4 py-3 font-black transition ${
                slotType === 'available'
                  ? 'border-bf-orange bg-bf-orange/15 text-bf-orange'
                  : 'border-bf-cream/10 bg-black/20 text-bf-cream/62'
              }`}
              type="button"
              onClick={() => setSlotType('available')}
            >
              Диапазон времени
            </button>
            <button
              className={`rounded-xl border px-4 py-3 font-black transition ${
                slotType === 'full_day_available'
                  ? 'border-emerald-300/50 bg-emerald-500/15 text-emerald-100'
                  : 'border-bf-cream/10 bg-black/20 text-bf-cream/62'
              }`}
              type="button"
              onClick={() => setSlotType('full_day_available')}
            >
              Свободен весь день
            </button>
            <button
              className={`rounded-xl border px-4 py-3 font-black transition ${
                slotType === 'tentative'
                  ? 'border-orange-300/50 bg-orange-500/15 text-orange-100'
                  : 'border-bf-cream/10 bg-black/20 text-bf-cream/62'
              }`}
              type="button"
              onClick={() => setSlotType('tentative')}
            >
              Не уверен
            </button>
            <button
              className={`rounded-xl border px-4 py-3 font-black transition ${
                slotType === 'unavailable'
                  ? 'border-red-300/50 bg-red-500/15 text-red-100'
                  : 'border-bf-cream/10 bg-black/20 text-bf-cream/62'
              }`}
              type="button"
              onClick={() => setSlotType('unavailable')}
            >
              Не могу в этот день
            </button>
          </div>

          <label className="grid gap-2 text-sm font-black text-bf-cream/70">
            День
            <select
              className="h-12 rounded-xl border border-bf-cream/10 bg-black/30 px-4 text-slate-100 outline-none focus:border-bf-orange/50"
              value={dayOfWeek}
              onChange={(inputEvent) => setDayOfWeek(Number(inputEvent.target.value))}
            >
              {days.map((dayOption) => (
                <option key={dayOption.value} value={dayOption.value}>
                  {dayOption.label} - {dayOption.date}
                </option>
              ))}
            </select>
            {errors.day_of_week ? <span className="text-red-200">{errors.day_of_week.join(', ')}</span> : null}
          </label>

          {slotType === 'available' ? (
            <div className="grid grid-cols-2 gap-4 max-sm:grid-cols-1">
              <label className="grid gap-2 text-sm font-black text-bf-cream/70">
                С
                <select
                  className="h-12 rounded-xl border border-bf-cream/10 bg-black/30 px-4 text-slate-100 outline-none focus:border-bf-orange/50"
                  value={startTimeMinutes}
                  onChange={(inputEvent) => setStartTimeMinutes(Number(inputEvent.target.value))}
                >
                  {startChoices.map((choice) => (
                    <option key={choice.value} value={choice.value}>
                      {choice.label}
                    </option>
                  ))}
                </select>
                {errors.start_time_minutes ? <span className="text-red-200">{errors.start_time_minutes.join(', ')}</span> : null}
              </label>
              <label className="grid gap-2 text-sm font-black text-bf-cream/70">
                До
                <select
                  className="h-12 rounded-xl border border-bf-cream/10 bg-black/30 px-4 text-slate-100 outline-none focus:border-bf-orange/50"
                  value={endTimeMinutes}
                  onChange={(inputEvent) => setEndTimeMinutes(Number(inputEvent.target.value))}
                >
                  {endChoices.map((choice) => (
                    <option key={choice.value} value={choice.value}>
                      {choice.label}
                    </option>
                  ))}
                </select>
                {errors.end_time_minutes ? <span className="text-red-200">{errors.end_time_minutes.join(', ')}</span> : null}
              </label>
            </div>
          ) : null}

          <label className="grid gap-2 text-sm font-black text-bf-cream/70">
            Комментарий
            <input
              className="h-12 rounded-xl border border-bf-cream/10 bg-black/30 px-4 text-slate-100 outline-none placeholder:text-bf-cream/35 focus:border-bf-orange/50"
              value={note}
              onChange={(inputEvent) => setNote(inputEvent.target.value)}
              placeholder="Дополнительная информация"
            />
          </label>
        </div>

        <div className="mt-6 flex flex-wrap justify-between gap-3">
          <div>
            {isEditing ? (
              <button
                className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-red-300/30 px-4 font-black text-red-100 transition hover:bg-red-500/10"
                type="button"
                disabled={isSaving}
                onClick={handleDelete}
              >
                <Trash2 size={18} />
                Удалить
              </button>
            ) : null}
          </div>
          <div className="flex gap-3">
            <button
              className="min-h-11 rounded-xl border border-bf-cream/10 px-4 font-black text-bf-cream/70 transition hover:border-bf-orange/40"
              type="button"
              onClick={onClose}
            >
              Отмена
            </button>
            <button
              className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-gradient-to-b from-orange-400 to-bf-orange px-5 font-black text-black transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:translate-y-0"
              type="submit"
              disabled={isSaving}
            >
              <Save size={18} />
              Сохранить
            </button>
          </div>
        </div>
      </motion.form>
    </div>
  );
}
