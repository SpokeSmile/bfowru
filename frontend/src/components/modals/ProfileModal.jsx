import { useState } from 'react';
import { motion } from 'framer-motion';
import { Save, X } from 'lucide-react';

import { updateProfile } from '../../api.js';

export default function ProfileModal({ player, onClose, onSaved }) {
  const [battleTagsText, setBattleTagsText] = useState(player.battleTagsText || '');
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  async function handleSubmit(submitEvent) {
    submitEvent.preventDefault();
    setIsSaving(true);
    setError('');
    try {
      const response = await updateProfile({ battleTagsText });
      await onSaved(response.profile || response.player);
    } catch (saveError) {
      setError(saveError.payload?.error || saveError.message);
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4 backdrop-blur-sm">
      <motion.form
        initial={{ opacity: 0, y: 24, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        className="w-full max-w-xl rounded-xl border border-bf-cream/12 bg-[#0d1420] p-6 shadow-panel"
        onSubmit={handleSubmit}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-sm font-black uppercase text-bf-orange">Profile editor</div>
            <h2 className="mt-1 text-2xl font-black uppercase text-slate-100">Игровые профили</h2>
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

        {error ? (
          <div className="mt-4 rounded-xl border border-red-400/30 bg-red-500/10 p-3 text-sm text-red-100">{error}</div>
        ) : null}

        <div className="mt-6 grid gap-5">
          <label className="grid gap-2 text-sm font-black text-bf-cream/70">
            BattleTag&apos;и
            <textarea
              className="min-h-32 rounded-xl border border-bf-cream/10 bg-black/30 px-4 py-3 text-slate-100 outline-none placeholder:text-bf-cream/35 focus:border-bf-orange/50"
              value={battleTagsText}
              onChange={(inputEvent) => setBattleTagsText(inputEvent.target.value)}
              placeholder={'По одному на строку\nBlackFlock#21234\nBlackFlockAlt#19876'}
            />
            <span className="text-xs font-medium text-bf-cream/45">Если аккаунтов несколько, указывай каждый BattleTag с новой строки.</span>
          </label>
        </div>

        <div className="mt-6 flex justify-end gap-3">
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
      </motion.form>
    </div>
  );
}
