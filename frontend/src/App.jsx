import { useEffect, useState } from 'react';
import {
  AlertTriangle,
  RefreshCw,
  Save,
} from 'lucide-react';

import {
  bootstrap,
  changePassword,
  disconnectDiscord,
  fetchGameUpdateDetail,
  fetchGameUpdates,
  fetchOverwatchStats,
  refreshOverwatchStats,
  updateProfile,
} from './api.js';
import { Header, Sidebar } from './components/AppChrome.jsx';
import { Avatar } from './components/common.jsx';
import EventModal from './components/modals/EventModal.jsx';
import ProfileModal from './components/modals/ProfileModal.jsx';
import OverwatchStatsPage from './components/OverwatchStatsPage.jsx';
import CommentTooltip from './components/schedule/CommentTooltip.jsx';
import RosterPage from './components/schedule/RosterPage.jsx';
import TeamPage from './components/TeamPage.jsx';
import UpdatesPage from './components/UpdatesPage.jsx';
import {
  discordFeedbackFromUrl,
} from './scheduleConfig.js';

function ProfilePage({ user, profile, profileType, onSaved }) {
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

export default function App() {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [slotModal, setSlotModal] = useState(null);
  const [profileModalPlayer, setProfileModalPlayer] = useState(null);
  const [commentTooltip, setCommentTooltip] = useState(null);
  const [updatesList, setUpdatesList] = useState([]);
  const [updatesBySlug, setUpdatesBySlug] = useState({});
  const [isLoadingUpdatesList, setIsLoadingUpdatesList] = useState(false);
  const [isLoadingUpdateDetail, setIsLoadingUpdateDetail] = useState(false);
  const [updatesError, setUpdatesError] = useState('');
  const [selectedUpdateSlug, setSelectedUpdateSlug] = useState(() => new URLSearchParams(window.location.search).get('patch') || '');
  const statsMode = 'competitive';
  const [statsByMode, setStatsByMode] = useState({});
  const [isLoadingStats, setIsLoadingStats] = useState(false);
  const [isRefreshingStats, setIsRefreshingStats] = useState(false);
  const [statsError, setStatsError] = useState('');

  async function loadData() {
    setIsLoading(true);
    try {
      const response = await bootstrap();
      setData(response);
      setError('');
    } catch (loadError) {
      setError(loadError.message);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  async function loadUpdatesList() {
    setIsLoadingUpdatesList(true);
    setUpdatesError('');
    try {
      const response = await fetchGameUpdates();
      setUpdatesList(response.updates || []);
      return response.updates || [];
    } catch (loadError) {
      setUpdatesError(loadError.message);
      return [];
    } finally {
      setIsLoadingUpdatesList(false);
    }
  }

  async function loadUpdateDetail(slug) {
    if (!slug || updatesBySlug[slug]) {
      return updatesBySlug[slug] || null;
    }

    setIsLoadingUpdateDetail(true);
    setUpdatesError('');
    try {
      const response = await fetchGameUpdateDetail(slug);
      setUpdatesBySlug((current) => ({
        ...current,
        [slug]: response.update,
      }));
      return response.update;
    } catch (loadError) {
      setUpdatesError(loadError.message);
      return null;
    } finally {
      setIsLoadingUpdateDetail(false);
    }
  }

  function selectUpdate(slug) {
    setSelectedUpdateSlug(slug);
    const params = new URLSearchParams(window.location.search);
    if (slug) {
      params.set('patch', slug);
    } else {
      params.delete('patch');
    }
    const query = params.toString();
    window.history.replaceState({}, document.title, `${window.location.pathname}${query ? `?${query}` : ''}`);
  }

  async function loadOverwatchStats(mode) {
    setIsLoadingStats(true);
    setStatsError('');
    try {
      const response = await fetchOverwatchStats(mode);
      setStatsByMode((current) => ({
        ...current,
        [response.stats.mode]: response.stats,
      }));
      return response.stats;
    } catch (loadError) {
      setStatsError(loadError.message);
      return null;
    } finally {
      setIsLoadingStats(false);
    }
  }

  async function handleOverwatchStatsRefresh() {
    setIsRefreshingStats(true);
    setStatsError('');
    try {
      const response = await refreshOverwatchStats(statsMode);
      setStatsByMode((current) => ({
        ...current,
        [response.stats.mode]: response.stats,
      }));
    } catch (refreshError) {
      setStatsError(refreshError.message);
    } finally {
      setIsRefreshingStats(false);
    }
  }

  useEffect(() => {
    if (!commentTooltip) return;

    const handleViewportChange = () => setCommentTooltip(null);
    window.addEventListener('scroll', handleViewportChange, true);
    window.addEventListener('resize', handleViewportChange);

    return () => {
      window.removeEventListener('scroll', handleViewportChange, true);
      window.removeEventListener('resize', handleViewportChange);
    };
  }, [commentTooltip]);

  const pathname = window.location.pathname;
  const isUpdatesPage = pathname.startsWith('/updates');
  const isStatsPage = pathname.startsWith('/stats');

  useEffect(() => {
    if (!isUpdatesPage) return;

    let isMounted = true;

    loadUpdatesList().then((updates) => {
      if (!isMounted) return;
      const requestedSlug = new URLSearchParams(window.location.search).get('patch') || '';
      const initialSlug = updates.some((item) => item.slug === requestedSlug)
        ? requestedSlug
        : updates[0]?.slug || '';

      if (initialSlug) {
        setSelectedUpdateSlug(initialSlug);
        const params = new URLSearchParams(window.location.search);
        if (params.get('patch') !== initialSlug) {
          params.set('patch', initialSlug);
          window.history.replaceState({}, document.title, `${window.location.pathname}?${params.toString()}`);
        }
      } else {
        setSelectedUpdateSlug('');
      }
    });

    return () => {
      isMounted = false;
    };
  }, [isUpdatesPage]);

  useEffect(() => {
    if (!isUpdatesPage || !selectedUpdateSlug) return;
    loadUpdateDetail(selectedUpdateSlug);
  }, [isUpdatesPage, selectedUpdateSlug]);

  useEffect(() => {
    if (!isStatsPage) return;
    loadOverwatchStats(statsMode);
  }, [isStatsPage, statsMode]);

  function handleNoteHoverStart(text, anchorRect) {
    setCommentTooltip({
      text,
      anchorRect,
      placement: 'bottom',
      visible: true,
    });
  }

  function handleNoteHoverEnd() {
    setCommentTooltip(null);
  }

  function upsertSlot(slot) {
    setData((current) => ({
      ...current,
      slots: current.slots.some((existing) => existing.id === slot.id)
        ? current.slots.map((existing) => (existing.id === slot.id ? slot : existing))
        : [...current.slots, slot],
    }));
    setSlotModal(null);
  }

  function removeSlot(id) {
    setData((current) => ({
      ...current,
      slots: current.slots.filter((slot) => slot.id !== id),
    }));
    setSlotModal(null);
  }

  async function updatePlayerProfile(player, options = {}) {
    if (options.reload) {
      await loadData();
      setProfileModalPlayer(null);
      return;
    }
    setData((current) => ({
      ...current,
      players: current.players.map((existing) => (existing.id === player.id ? player : existing)),
    }));
    setProfileModalPlayer(null);
  }

  async function updateStaffProfile(staffMember, options = {}) {
    if (options.reload) {
      await loadData();
      return;
    }
    setData((current) => ({
      ...current,
      staffMembers: current.staffMembers.map((existing) => (existing.id === staffMember.id ? staffMember : existing)),
    }));
  }

  if (isLoading) {
    return (
      <main className="grid min-h-screen place-items-center px-6">
        <div className="glass-panel rounded-xl px-8 py-6 text-center">
          <RefreshCw className="mx-auto animate-spin text-bf-orange" />
          <div className="mt-3 font-black uppercase">Загрузка данных</div>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="grid min-h-screen place-items-center px-6">
        <div className="glass-panel max-w-md rounded-xl px-8 py-6 text-center">
          <AlertTriangle className="mx-auto text-red-300" />
          <div className="mt-3 font-black uppercase">Не удалось загрузить данные</div>
          <p className="mt-2 text-bf-cream/60">{error}</p>
          <button className="mt-5 rounded-xl bg-bf-orange px-5 py-3 font-black text-black" type="button" onClick={loadData}>
            Повторить
          </button>
        </div>
      </main>
    );
  }

  const canAdd = Boolean(data.user.playerId);
  const isProfilePage = pathname.startsWith('/profile');
  const isTeamPage = pathname.startsWith('/team');
  const currentPlayer = data.players.find((player) => player.id === data.user.playerId) || null;
  const currentStaffMember = data.staffMembers.find((staffMember) => staffMember.id === data.user.staffMemberId) || null;
  const currentProfile = data.user.profileType === 'staff' ? currentStaffMember : currentPlayer;
  const handleProfileSaved = data.user.profileType === 'staff' ? updateStaffProfile : updatePlayerProfile;
  const selectedUpdate = selectedUpdateSlug ? updatesBySlug[selectedUpdateSlug] || null : null;
  const selectedStats = statsByMode[statsMode] || null;

  return (
    <main className="mx-auto min-h-screen w-[min(1500px,calc(100%_-_48px))] py-4 xl:w-[min(1700px,calc(100%_-_32px))] 2xl:w-[min(1820px,calc(100%_-_28px))] max-sm:w-[min(100%_-_20px,760px)]">
      <div className="app-shell">
        <Sidebar pathname={pathname} />
        <div className="min-w-0">
          <Header user={data.user} />
          {isProfilePage ? (
            <ProfilePage
              user={data.user}
              profile={currentProfile}
              profileType={data.user.profileType}
              onSaved={handleProfileSaved}
            />
          ) : isTeamPage ? (
            <TeamPage players={data.players} staffMembers={data.staffMembers} />
          ) : isUpdatesPage ? (
            <UpdatesPage
              updates={updatesList}
              selectedSlug={selectedUpdateSlug}
              selectedUpdate={selectedUpdate}
              onSelect={selectUpdate}
              isLoadingList={isLoadingUpdatesList}
              isLoadingDetail={isLoadingUpdateDetail}
              error={updatesError}
            />
          ) : isStatsPage ? (
            <OverwatchStatsPage
              stats={selectedStats}
              isLoading={isLoadingStats}
              isRefreshing={isRefreshingStats}
              error={statsError}
              onRefresh={handleOverwatchStatsRefresh}
            />
          ) : (
            <>
              <RosterPage
                canAdd={canAdd}
                days={data.days}
                players={data.players}
                slots={data.slots}
                dayEventTypes={data.dayEventTypes}
                eventTypes={data.eventTypes}
                lastUpdated={data.lastUpdated}
                onAdd={(day) => setSlotModal({ day })}
                onEdit={(event) => setSlotModal({ event })}
                onNoteHoverStart={handleNoteHoverStart}
                onNoteHoverEnd={handleNoteHoverEnd}
              />
            </>
          )}
        </div>
      </div>
      {slotModal ? (
        <EventModal
          event={slotModal.event}
          day={slotModal.day}
          days={data.days}
          onClose={() => setSlotModal(null)}
          onSaved={upsertSlot}
          onDeleted={removeSlot}
        />
      ) : null}
      {profileModalPlayer ? (
        <ProfileModal
          player={profileModalPlayer}
          onClose={() => setProfileModalPlayer(null)}
          onSaved={updatePlayerProfile}
        />
      ) : null}
      {commentTooltip?.visible ? (
        <CommentTooltip
          key={`${commentTooltip.anchorRect.left}-${commentTooltip.anchorRect.top}-${commentTooltip.text}`}
          tooltip={commentTooltip}
        />
      ) : null}
    </main>
  );
}
