import { useEffect, useState } from 'react';
import { Save } from 'lucide-react';

import { changePassword, disconnectDiscord, updateProfile } from '../../api.js';
import { discordFeedbackFromUrl } from '../../scheduleConfig.js';
import { Avatar } from '../common.jsx';

export default function ProfilePage({ user, profile, profileType, onSaved }) {
  const isPlayerProfile = profileType === 'player';
  const isStaffProfile = profileType === 'staff';
  const [name, setName] = useState(profile?.name || '');
  const [battleTagsText, setBattleTagsText] = useState(profile?.battleTagsText || '');
  const [profileErrors, setProfileErrors] = useState({});
  const [profileSuccess, setProfileSuccess] = useState('');
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [discordFeedback, setDiscordFeedback] = useState(() => discordFeedbackFromUrl(window.location.search));
  const [isDisconnectingDiscord, setIsDisconnectingDiscord] = useState(false);

  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newPasswordConfirm, setNewPasswordConfirm] = useState('');
  const [passwordErrors, setPasswordErrors] = useState({});
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [isSavingPassword, setIsSavingPassword] = useState(false);

  useEffect(() => {
    setName(profile?.name || '');
    setBattleTagsText(profile?.battleTagsText || '');
  }, [profile]);

  useEffect(() => {
    if (!discordFeedbackFromUrl(window.location.search)) return;
    window.history.replaceState({}, document.title, window.location.pathname);
  }, []);

  async function handleProfileSubmit(submitEvent) {
    submitEvent.preventDefault();
    setIsSavingProfile(true);
    setProfileErrors({});
    setProfileSuccess('');
    try {
      const payload = { name };
      if (isPlayerProfile) {
        payload.battleTagsText = battleTagsText;
      }
      const response = await updateProfile(payload);
      await onSaved(response.profile || response.player);
      setProfileSuccess('Профиль сохранен.');
    } catch (saveError) {
      setProfileErrors(saveError.payload?.errors || { __all__: [saveError.message] });
    } finally {
      setIsSavingProfile(false);
    }
  }

  async function handleDiscordDisconnect() {
    setIsDisconnectingDiscord(true);
    setDiscordFeedback(null);
    try {
      await disconnectDiscord();
      await onSaved(null, { reload: true });
      setDiscordFeedback({ tone: 'success', text: 'Discord отвязан.' });
    } catch (disconnectError) {
      setDiscordFeedback({ tone: 'error', text: disconnectError.message });
    } finally {
      setIsDisconnectingDiscord(false);
    }
  }

  async function handlePasswordSubmit(submitEvent) {
    submitEvent.preventDefault();
    setIsSavingPassword(true);
    setPasswordErrors({});
    setPasswordSuccess('');
    try {
      await changePassword({ oldPassword, newPassword, newPasswordConfirm });
      setOldPassword('');
      setNewPassword('');
      setNewPasswordConfirm('');
      setPasswordSuccess('Пароль обновлен.')
    } catch (saveError) {
      setPasswordErrors(saveError.payload?.errors || { __all__: [saveError.message] });
    } finally {
      setIsSavingPassword(false);
    }
  }

  if (!profile) {
    return (
      <section className="glass-panel mt-4 rounded-xl p-6">
        <div className="text-sm font-black uppercase text-bf-orange">Profile</div>
        <h1 className="mt-1 text-3xl font-black uppercase text-slate-100">Профиль</h1>
        <p className="mt-4 text-bf-cream/62">Аккаунт не привязан ни к игроку, ни к организаторскому составу. Обратитесь к администратору.</p>
      </section>
    );
  }

  return (
    <section className="glass-panel mt-4 rounded-xl p-5">
      <div className="mb-5">
        <div>
          <div className="text-sm font-black uppercase text-bf-orange">Profile</div>
          <h1 className="mt-1 text-3xl font-black uppercase text-slate-100">
            {isStaffProfile ? 'Профиль организатора' : 'Профиль игрока'}
          </h1>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
        <form className="rounded-xl border border-bf-cream/10 bg-black/24 p-5" onSubmit={handleProfileSubmit}>
          <div className="text-sm font-black uppercase text-bf-orange">
            {isStaffProfile ? 'Контактные данные' : 'Игровые данные'}
          </div>
          {profileErrors.__all__ ? (
            <div className="mt-4 rounded-xl border border-red-400/30 bg-red-500/10 p-3 text-sm text-red-100">
              {profileErrors.__all__.join(', ')}
            </div>
          ) : null}
          {profileSuccess ? (
            <div className="mt-4 rounded-xl border border-emerald-400/25 bg-emerald-500/10 p-3 text-sm text-emerald-100">
              {profileSuccess}
            </div>
          ) : null}
          {discordFeedback ? (
            <div
              className={`mt-4 rounded-xl p-3 text-sm ${
                discordFeedback.tone === 'success'
                  ? 'border border-emerald-400/25 bg-emerald-500/10 text-emerald-100'
                  : 'border border-red-400/30 bg-red-500/10 text-red-100'
              }`}
            >
              {discordFeedback.text}
            </div>
          ) : null}
          <div className="mt-5 grid gap-4">
            <label className="grid gap-2 text-sm font-black text-bf-cream/70">
              Логин
              <input
                className="h-12 rounded-xl border border-bf-cream/10 bg-black/20 px-4 text-bf-cream/52 outline-none"
                value={user.username}
                readOnly
              />
            </label>
            <label className="grid gap-2 text-sm font-black text-bf-cream/70">
              {isStaffProfile ? 'Имя' : 'Имя игрока'}
              <input
                className="h-12 rounded-xl border border-bf-cream/10 bg-black/30 px-4 text-slate-100 outline-none focus:border-bf-orange/45"
                value={name}
                onChange={(inputEvent) => setName(inputEvent.target.value)}
              />
              {profileErrors.name ? <span className="text-red-200">{profileErrors.name.join(', ')}</span> : null}
            </label>
            {isPlayerProfile ? (
              <label className="grid gap-2 text-sm font-black text-bf-cream/70">
                BattleTag&apos;и
                <textarea
                  className="min-h-36 rounded-xl border border-bf-cream/10 bg-black/30 px-4 py-3 text-slate-100 outline-none placeholder:text-bf-cream/35 focus:border-bf-orange/45"
                  value={battleTagsText}
                  onChange={(inputEvent) => setBattleTagsText(inputEvent.target.value)}
                  placeholder={'По одному на строку\nBlackFlock#21234\nBlackFlockAlt#19876'}
                />
              </label>
            ) : null}
            <div className="rounded-xl border border-bf-cream/10 bg-black/28 px-4 py-4">
              <div className="text-sm font-black uppercase text-bf-orange">Discord</div>
              {profile.discordConnected ? (
                <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <Avatar src={profile.avatarUrl} alt={profile.discordDisplayTag} fallbackLabel={profile.name || profile.discordDisplayTag} className="h-12 w-12 object-cover" />
                    <div>
                      <div className="text-sm font-black text-slate-100">{profile.discordDisplayTag || '@unknown'}</div>
                      <div className="mt-1 text-xs text-bf-cream/50">
                        {profile.discordGlobalName || 'Подключенный аккаунт Discord'}
                      </div>
                    </div>
                  </div>
                  <button
                    className="inline-flex min-h-10 items-center rounded-xl border border-red-300/30 px-4 font-black text-red-100 transition hover:bg-red-500/10 disabled:cursor-not-allowed disabled:opacity-45"
                    type="button"
                    onClick={handleDiscordDisconnect}
                    disabled={isDisconnectingDiscord}
                  >
                    Отвязать Discord
                  </button>
                </div>
              ) : (
                <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <div className="text-sm font-semibold text-slate-100">Не подключен</div>
                    <div className="mt-1 text-xs text-bf-cream/50">Аватар и Discord handle подтянутся автоматически после подключения.</div>
                  </div>
                  <button
                    className="inline-flex min-h-10 items-center rounded-xl bg-bf-orange px-4 font-black text-black transition hover:-translate-y-0.5 hover:shadow-[0_10px_22px_rgba(216,109,56,0.18)]"
                    type="button"
                    onClick={() => {
                      window.location.href = '/api/discord/connect/';
                    }}
                  >
                    Подключить Discord
                  </button>
                </div>
              )}
            </div>
          </div>
          <div className="mt-5 flex justify-end">
            <button
              className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-gradient-to-b from-orange-400 to-bf-orange px-5 font-black text-black transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:translate-y-0"
              type="submit"
              disabled={isSavingProfile}
            >
              <Save size={18} />
              Сохранить профиль
            </button>
          </div>
        </form>

        <form className="rounded-xl border border-bf-cream/10 bg-black/24 p-5" onSubmit={handlePasswordSubmit}>
          <div className="text-sm font-black uppercase text-bf-orange">Безопасность</div>
          {passwordErrors.__all__ ? (
            <div className="mt-4 rounded-xl border border-red-400/30 bg-red-500/10 p-3 text-sm text-red-100">
              {passwordErrors.__all__.join(', ')}
            </div>
          ) : null}
          {passwordSuccess ? (
            <div className="mt-4 rounded-xl border border-emerald-400/25 bg-emerald-500/10 p-3 text-sm text-emerald-100">
              {passwordSuccess}
            </div>
          ) : null}
          <div className="mt-5 grid gap-4">
            <label className="grid gap-2 text-sm font-black text-bf-cream/70">
              Старый пароль
              <input
                type="password"
                className="h-12 rounded-xl border border-bf-cream/10 bg-black/30 px-4 text-slate-100 outline-none focus:border-bf-orange/45"
                value={oldPassword}
                onChange={(inputEvent) => setOldPassword(inputEvent.target.value)}
              />
              {passwordErrors.oldPassword ? <span className="text-red-200">{passwordErrors.oldPassword.join(', ')}</span> : null}
            </label>
            <label className="grid gap-2 text-sm font-black text-bf-cream/70">
              Новый пароль
              <input
                type="password"
                className="h-12 rounded-xl border border-bf-cream/10 bg-black/30 px-4 text-slate-100 outline-none focus:border-bf-orange/45"
                value={newPassword}
                onChange={(inputEvent) => setNewPassword(inputEvent.target.value)}
              />
              {passwordErrors.newPassword ? <span className="text-red-200">{passwordErrors.newPassword.join(', ')}</span> : null}
            </label>
            <label className="grid gap-2 text-sm font-black text-bf-cream/70">
              Повторите новый пароль
              <input
                type="password"
                className="h-12 rounded-xl border border-bf-cream/10 bg-black/30 px-4 text-slate-100 outline-none focus:border-bf-orange/45"
                value={newPasswordConfirm}
                onChange={(inputEvent) => setNewPasswordConfirm(inputEvent.target.value)}
              />
              {passwordErrors.newPasswordConfirm ? <span className="text-red-200">{passwordErrors.newPasswordConfirm.join(', ')}</span> : null}
            </label>
          </div>
          <div className="mt-5 flex justify-end">
            <button
              className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-bf-orange/45 px-5 font-black text-bf-orange transition hover:bg-bf-orange/10 disabled:cursor-not-allowed disabled:opacity-45"
              type="submit"
              disabled={isSavingPassword}
            >
              <Save size={18} />
              Сменить пароль
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}
