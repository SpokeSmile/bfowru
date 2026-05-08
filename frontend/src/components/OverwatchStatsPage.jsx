import {
  BarChart3,
  Check,
  Clock3,
  Loader2,
  Trophy,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip as ChartTooltip,
  XAxis,
  YAxis,
} from 'recharts';

import { Avatar, RoleBadge } from './common.jsx';

function formatShortDateTime(value) {
  if (!value) return '—';
  return new Intl.DateTimeFormat('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

function formatInteger(value) {
  return new Intl.NumberFormat('ru-RU', {
    maximumFractionDigits: 0,
  }).format(Number.isFinite(value) ? value : 0);
}

function formatDecimal(value, digits = 1) {
  if (!Number.isFinite(value)) return '—';
  return new Intl.NumberFormat('ru-RU', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(value);
}

function formatPercent(value) {
  if (!Number.isFinite(value)) return '—';
  return `${formatDecimal(value, 1)}%`;
}

function formatHours(seconds) {
  const hours = Math.round((Number(seconds) || 0) / 3600);
  return `${formatInteger(hours)} ч.`;
}

function basePlayerToStatsRow(player) {
  return {
    id: player.id,
    name: player.name,
    role: player.role,
    roleColor: player.roleColor,
    avatarUrl: player.avatarUrl,
    battleTag: player.battleTag || player.battleTags?.[0] || '',
    status: 'loading',
  };
}

function useRollingNumber(min, max, durationMs = 2800, precision = 0) {
  const [value, setValue] = useState(() => min);
  const [motion] = useState(() => ({
    duration: durationMs + Math.round(Math.random() * 700),
    phase: Math.random() * durationMs,
  }));

  useEffect(() => {
    let animationFrame = 0;
    const range = max - min;

    function animate() {
      const elapsed = (window.performance.now() + motion.phase) % motion.duration;
      const halfDuration = motion.duration / 2;
      const progress = elapsed <= halfDuration
        ? elapsed / halfDuration
        : 1 - ((elapsed - halfDuration) / halfDuration);
      const eased = 0.5 - Math.cos(progress * Math.PI) / 2;
      const next = min + eased * range;
      setValue(Number(next.toFixed(precision)));
      animationFrame = window.requestAnimationFrame(animate);
    }

    animationFrame = window.requestAnimationFrame(animate);
    return () => window.cancelAnimationFrame(animationFrame);
  }, [max, min, motion, precision]);

  return value;
}

function easeInOutCubic(value) {
  return value < 0.5
    ? 4 * value * value * value
    : 1 - ((-2 * value + 2) ** 3) / 2;
}

function seededNumber(seed, min, max) {
  const text = String(seed);
  let hash = 0;
  for (let index = 0; index < text.length; index += 1) {
    hash = (hash * 31 + text.charCodeAt(index)) % 100000;
  }
  return min + (hash / 100000) * (max - min);
}

function useAnimatedNumber(target, startValue, durationMs = 850, precision = 0) {
  const normalizedTarget = Number.isFinite(target) ? target : 0;
  const [value, setValue] = useState(() => Number(startValue.toFixed(precision)));
  const valueRef = useRef(value);
  const previousTargetRef = useRef(null);

  useEffect(() => {
    let animationFrame = 0;
    const from = previousTargetRef.current === null ? startValue : valueRef.current;
    const to = normalizedTarget;
    const startedAt = window.performance.now();
    previousTargetRef.current = to;

    function animate(now) {
      const progress = Math.min((now - startedAt) / durationMs, 1);
      const next = from + (to - from) * easeInOutCubic(progress);
      const rounded = Number(next.toFixed(precision));
      valueRef.current = rounded;
      setValue(rounded);

      if (progress < 1) {
        animationFrame = window.requestAnimationFrame(animate);
      }
    }

    animationFrame = window.requestAnimationFrame(animate);
    return () => window.cancelAnimationFrame(animationFrame);
  }, [durationMs, normalizedTarget, precision, startValue]);

  return value;
}

const OVERWATCH_STATS_MODES = [
  { value: 'overview', label: 'Общая статистика' },
  { value: 'competitive', label: 'Competitive' },
];

const RANK_CHART_COLORS = {
  Champion: '#f6d266',
  Grandmaster: '#e6c462',
  Master: '#b58df4',
  Diamond: '#7fc7ff',
  Platinum: '#67dcc8',
  Gold: '#f2bf61',
  Silver: '#c9d2dc',
  Bronze: '#b4764f',
};

function StatSummaryCard({ icon: Icon, label, value, subLabel = '', caption, tone = 'orange' }) {
  const toneClass = {
    orange: 'text-bf-orange bg-bf-orange/10 border-bf-orange/20',
    green: 'text-emerald-200 bg-emerald-500/10 border-emerald-300/20',
    blue: 'text-sky-200 bg-sky-500/10 border-sky-300/20',
    purple: 'text-violet-200 bg-violet-500/10 border-violet-300/20',
    red: 'text-red-200 bg-red-500/10 border-red-300/20',
    muted: 'text-bf-cream/72 bg-black/24 border-bf-cream/10',
  }[tone];

  return (
    <div className="rounded-xl border border-bf-cream/10 bg-black/22 p-4">
      <div className="flex items-center gap-3">
        <div className={`grid h-10 w-10 place-items-center rounded-xl border ${toneClass}`}>
          <Icon size={19} />
        </div>
        <div className="min-w-0">
          <div className="text-[11px] font-black uppercase tracking-wide text-bf-cream/44">{label}</div>
          {subLabel ? <div className="mt-0.5 text-[11px] font-semibold text-bf-cream/42">{subLabel}</div> : null}
          <div className="mt-1 truncate text-2xl font-black text-slate-100">{value}</div>
        </div>
      </div>
      {caption ? <div className="mt-2 text-xs font-semibold text-bf-cream/46">{caption}</div> : null}
    </div>
  );
}

function StatsBanner({ updatedAt }) {
  return (
    <section className="glass-panel hero-banner relative mt-4 overflow-hidden rounded-xl border-bf-orange/25 px-6 py-6 lg:px-8">
      <div className="relative z-10 grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
        <div className="grid gap-3 lg:max-w-[620px]">
          <div className="text-sm font-black uppercase text-bf-orange">Black Flock team</div>
          <h1 className="text-4xl font-black uppercase leading-none text-slate-100 max-md:text-3xl">
            Статистика Overwatch
          </h1>
          <p className="text-sm font-semibold text-bf-cream/58">
            Данные OverFast API по первому BattleTag каждого игрока.
          </p>
        </div>

        <div className="grid justify-items-start gap-3 lg:justify-items-end">
          <div className="text-sm font-semibold text-bf-cream/35">
            Данные загружены: {formatShortDateTime(updatedAt)}
          </div>
        </div>
      </div>
    </section>
  );
}

function StatsFilterBar() {
  return (
    <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-bf-cream/10 bg-black/20 p-3">
      <div className="flex flex-wrap gap-2">
        {OVERWATCH_STATS_MODES.map((item) => (
          <span
            key={item.value}
            className="rounded-xl bg-bf-orange/18 px-4 py-2 text-xs font-black uppercase text-bf-orange shadow-[0_0_14px_rgba(243,112,30,0.10)] transition"
          >
            {item.label}
          </span>
        ))}
      </div>

      <div className="rounded-xl border border-bf-cream/10 bg-black/20 px-4 py-2 text-xs font-black uppercase text-bf-cream/35">
        All-time
      </div>
    </div>
  );
}

function HeroIcon({ hero, className = 'h-8 w-8' }) {
  const initial = (hero?.heroLabel || hero?.hero || '?').trim().slice(0, 1).toUpperCase();
  return (
    <span className={`grid shrink-0 place-items-center overflow-hidden rounded-xl border border-bf-cream/10 bg-black/28 ${className}`}>
      {hero?.heroIconUrl ? (
        <img className="h-full w-full object-cover" src={hero.heroIconUrl} alt="" loading="lazy" />
      ) : (
        <span className="text-xs font-black text-bf-cream/58">{initial}</span>
      )}
    </span>
  );
}

function LoadingMetric({ min = 10, max = 99, suffix = '', precision = 0, className = 'text-sm font-semibold text-slate-100' }) {
  const value = useRollingNumber(min, max, 3000, precision);
  const formattedValue = precision ? formatDecimal(value, precision) : formatInteger(Math.round(value));
  return (
    <span className={`inline-flex min-w-[42px] items-center transition-all duration-300 ${className}`}>
      {formattedValue}{suffix}
    </span>
  );
}

function AnimatedMetric({
  value,
  seed,
  min = 10,
  max = 99,
  precision = 0,
  suffix = '',
  formatter,
  className = 'text-sm font-semibold text-slate-100',
}) {
  const target = Number(value);
  const startValue = useMemo(
    () => seededNumber(seed, min, max),
    [max, min, seed],
  );
  const animatedValue = useAnimatedNumber(target, startValue, 900, precision);
  const content = formatter
    ? formatter(animatedValue)
    : `${precision ? formatDecimal(animatedValue, precision) : formatInteger(Math.round(animatedValue))}${suffix}`;

  return (
    <span className={`inline-flex min-w-[5ch] items-center whitespace-nowrap tabular-nums transition-colors duration-300 ${className}`}>
      {content}
    </span>
  );
}

function LoadingPercentBar() {
  const value = useRollingNumber(0, 100, 3200, 0);
  const width = `${Math.min(Math.max(value, 0), 100)}%`;

  return (
    <div className="min-w-[110px]">
      <div className="text-sm font-black text-slate-100 transition-all duration-300">{formatPercent(value)}</div>
      <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-bf-cream/10">
        <div
          className="h-full rounded-full bg-emerald-400 transition-all duration-300 ease-in-out"
          style={{ width }}
        />
      </div>
    </div>
  );
}

function AnimatedPercentBar({ value, seed }) {
  const startValue = useMemo(() => seededNumber(seed, 0, 100), [seed]);
  const animatedValue = useAnimatedNumber(value, startValue, 950, 1);
  const width = `${Math.min(Math.max(animatedValue || 0, 0), 100)}%`;

  return (
    <div className="min-w-[118px]">
      <div className="text-sm font-black text-slate-100 tabular-nums transition-colors duration-300">
        {formatPercent(animatedValue)}
      </div>
      <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-bf-cream/10">
        <div
          className="h-full rounded-full bg-emerald-400 transition-[width] duration-500 ease-out"
          style={{ width }}
        />
      </div>
    </div>
  );
}

function LoadingRankCell() {
  return (
    <div className="flex items-center gap-2 text-sm font-semibold text-bf-cream/58">
      <Loader2 className="h-5 w-5 animate-spin text-bf-orange" />
      <span className="h-4 w-20 rounded-full bg-bf-cream/10" />
    </div>
  );
}

function LoadingHeroCell() {
  return (
    <div className="flex items-center gap-2">
      <span className="grid h-8 w-8 place-items-center rounded-xl border border-bf-cream/10 bg-black/28">
        <Loader2 className="h-4 w-4 animate-spin text-bf-orange" />
      </span>
      <div className="grid gap-1">
        <span className="h-4 w-24 rounded-full bg-bf-cream/10" />
        <span className="h-3 w-12 rounded-full bg-bf-cream/8" />
      </div>
    </div>
  );
}

function LoadingWinLossCell() {
  const wins = Math.round(useRollingNumber(10, 99, 3300, 0));
  const losses = Math.round(useRollingNumber(10, 99, 3600, 0));

  return (
    <span className="transition-all duration-300">
      <span className="text-emerald-300">{formatInteger(wins)}W</span>
      <span className="mx-1 text-bf-cream/28">/</span>
      <span className="text-red-300">{formatInteger(losses)}L</span>
    </span>
  );
}

function AnimatedWinLossCell({ wins, losses, seed }) {
  return (
    <span className="inline-flex min-w-[9ch] items-center whitespace-nowrap tabular-nums transition-colors duration-300">
      <AnimatedMetric
        value={wins}
        seed={`${seed}-wins`}
        suffix="W"
        className="font-black text-emerald-300"
      />
      <span className="mx-1 text-bf-cream/28">/</span>
      <AnimatedMetric
        value={losses}
        seed={`${seed}-losses`}
        suffix="L"
        className="font-black text-red-300"
      />
    </span>
  );
}

function LoadingStatSummaryValue({ type }) {
  if (type === 'rank') {
    return <span className="inline-block h-7 w-28 rounded-full bg-bf-cream/10 align-middle" />;
  }
  if (type === 'percent') {
    return <LoadingMetric min={0} max={100} suffix="%" className="text-2xl font-black text-slate-100" />;
  }
  if (type === 'hours') {
    return <LoadingMetric suffix=" ч." className="text-2xl font-black text-slate-100" />;
  }
  return <LoadingMetric className="text-2xl font-black text-slate-100" />;
}

function LoadingCharts() {
  return (
    <section className="mt-4 grid gap-4 xl:grid-cols-[1fr_1.15fr]">
      <div className="glass-panel rounded-xl p-4">
        <div className="mb-4 text-sm font-black uppercase text-slate-100">Распределение рангов</div>
        <div className="grid h-64 content-center gap-3">
          {[72, 52, 84, 45, 64].map((width, index) => (
            <div key={width} className="flex items-center gap-3">
              <span className="h-3 w-24 rounded-full bg-bf-cream/8" />
              <span
                className="h-4 rounded-full bg-bf-orange/30 transition-all duration-500"
                style={{ width: `${width - (index % 2) * 16}%` }}
              />
            </div>
          ))}
        </div>
      </div>

      <div className="glass-panel rounded-xl p-4">
        <div className="mb-4 text-sm font-black uppercase text-slate-100">Топ героев</div>
        <div className="grid gap-2">
          {[0, 1, 2, 3, 4].map((item) => (
            <div key={item} className="grid grid-cols-[minmax(0,1fr)_80px_80px_90px] items-center gap-3 rounded-xl bg-black/18 px-3 py-2 text-sm">
              <div className="flex items-center gap-2">
                <span className="grid h-7 w-7 place-items-center rounded-xl border border-bf-cream/10 bg-black/28">
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-bf-orange" />
                </span>
                <span className="h-4 w-24 rounded-full bg-bf-cream/10" />
              </div>
              <LoadingMetric min={0} max={100} suffix="%" className="font-black text-emerald-300" />
              <LoadingMetric className="font-semibold text-bf-cream/72" />
              <LoadingMetric suffix=" ч." className="font-semibold text-bf-cream/72" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function PlayerStatsTable({ players, isLoading }) {
  return (
    <div className="mt-4 overflow-x-auto rounded-xl border border-bf-cream/10">
      <table className="min-w-[1350px] w-full table-fixed border-collapse bg-[#111925]/86 text-left tabular-nums">
        <colgroup>
          <col className="w-[250px]" />
          <col className="w-[150px]" />
          <col className="w-[195px]" />
          <col className="w-[145px]" />
          <col className="w-[105px]" />
          <col className="w-[125px]" />
          <col className="w-[90px]" />
          <col className="w-[145px]" />
          <col className="w-[145px]" />
        </colgroup>
        <thead>
          <tr className="border-b border-bf-cream/10 bg-[#121d2b] text-[11px] font-black uppercase tracking-wide text-bf-cream/42">
            <th className="px-4 py-3">Игрок</th>
            <th className="px-4 py-3">Ранг</th>
            <th className="px-4 py-3">Основной герой</th>
            <th className="px-4 py-3">Winrate</th>
            <th className="px-4 py-3">Матчей</th>
            <th className="px-4 py-3">W / L</th>
            <th className="px-4 py-3">K/D</th>
            <th className="px-4 py-3">Сред. убийств</th>
            <th className="px-4 py-3">Средняя смерть</th>
          </tr>
        </thead>
        <tbody>
          {players.map((player) => {
            const isReady = !isLoading && player.status === 'ready';
            return (
              <tr key={player.id} className="border-b border-bf-cream/10 bg-black/10 transition-colors duration-300 last:border-b-0 hover:bg-bf-steel/10">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <Avatar src={player.avatarUrl} alt={player.name} fallbackLabel={player.name} className="h-10 w-10 object-cover" />
                    <div className="min-w-0">
                      <div className="truncate text-sm font-black text-slate-100">{player.name}</div>
                      <div className="mt-1 flex flex-wrap items-center gap-1.5">
                        <RoleBadge role={player.role} color={player.roleColor} />
                        {player.battleTag ? (
                          <span className="text-[11px] font-semibold text-bf-cream/42">{player.battleTag}</span>
                        ) : null}
                      </div>
                      {!isLoading && !isReady ? (
                        <div className="mt-1 text-xs font-semibold text-amber-100/75">{player.error || 'Данные недоступны'}</div>
                      ) : null}
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-sm font-semibold text-slate-100">
                  {isLoading ? (
                    <LoadingRankCell />
                  ) : isReady && player.rank ? (
                    <div className="flex items-center gap-2">
                      {player.rank.rankIcon ? (
                        <img className="h-5 w-5" src={player.rank.rankIcon} alt="" />
                      ) : null}
                      <span>{player.rank.label}</span>
                    </div>
                  ) : '—'}
                </td>
                <td className="px-4 py-3 text-sm font-semibold text-slate-100">
                  {isLoading ? (
                    <LoadingHeroCell />
                  ) : isReady && player.mainHero ? (
                    <div className="flex items-center gap-2">
                      <HeroIcon hero={player.mainHero} />
                      <div className="min-w-0">
                        <div className="truncate font-black">{player.mainHero.heroLabel}</div>
                        <div className="mt-0.5 text-xs text-bf-cream/42">{formatHours(player.mainHero.timePlayed)}</div>
                      </div>
                    </div>
                  ) : '—'}
                </td>
                <td className="px-4 py-3">
                  {isLoading ? (
                    <LoadingPercentBar />
                  ) : isReady ? (
                    <AnimatedPercentBar value={player.winrate} seed={`${player.id}-winrate`} />
                  ) : '—'}
                </td>
                <td className="px-4 py-3 text-sm font-semibold text-slate-100">
                  {isLoading ? <LoadingMetric /> : isReady ? (
                    <AnimatedMetric value={player.matches} seed={`${player.id}-matches`} />
                  ) : '—'}
                </td>
                <td className="px-4 py-3 text-sm font-black">
                  {isLoading ? (
                    <LoadingWinLossCell />
                  ) : isReady ? (
                    <AnimatedWinLossCell wins={player.wins} losses={player.losses} seed={player.id} />
                  ) : '—'}
                </td>
                <td className="px-4 py-3 text-sm font-black text-emerald-300">
                  {isLoading ? <LoadingMetric className="text-sm font-black text-emerald-300" /> : isReady ? (
                    <AnimatedMetric
                      value={player.kd}
                      seed={`${player.id}-kd`}
                      precision={2}
                      className="text-sm font-black text-emerald-300"
                    />
                  ) : '—'}
                </td>
                <td className="px-4 py-3 text-sm font-semibold text-slate-100">
                  {isLoading ? <LoadingMetric /> : isReady ? (
                    <AnimatedMetric value={player.avgEliminations} seed={`${player.id}-avg-elims`} precision={1} />
                  ) : '—'}
                </td>
                <td className="px-4 py-3 text-sm font-semibold text-slate-100">
                  {isLoading ? <LoadingMetric /> : isReady ? (
                    <AnimatedMetric value={player.avgDeaths} seed={`${player.id}-avg-deaths`} precision={1} />
                  ) : '—'}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function StatsCharts({ stats }) {
  const rankRows = (stats.rankDistribution || []).filter((item) => item.count > 0);
  const topHeroes = stats.topHeroes || [];

  return (
    <section className="mt-4 grid gap-4 xl:grid-cols-[1fr_1.15fr]">
      <div className="glass-panel rounded-xl p-4">
        <div className="mb-4 text-sm font-black uppercase text-slate-100">Распределение рангов</div>
        {rankRows.length ? (
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={rankRows} layout="vertical" margin={{ top: 4, right: 12, left: 18, bottom: 4 }}>
                <CartesianGrid stroke="rgba(255,255,255,0.06)" horizontal={false} />
                <XAxis type="number" allowDecimals={false} stroke="rgba(236,241,248,0.36)" tickLine={false} axisLine={false} />
                <YAxis dataKey="divisionLabel" type="category" width={90} stroke="rgba(236,241,248,0.56)" tickLine={false} axisLine={false} />
                <ChartTooltip
                  cursor={{ fill: 'rgba(243,112,30,0.08)' }}
                  contentStyle={{ background: '#070c14', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 12, color: '#fff' }}
                  labelStyle={{ color: '#fff' }}
                  itemStyle={{ color: '#fff' }}
                  formatter={(value) => [value, 'Количество']}
                />
                <Bar dataKey="count" radius={[0, 10, 10, 0]}>
                  {rankRows.map((item) => (
                    <Cell key={item.division} fill={RANK_CHART_COLORS[item.divisionLabel] || '#f3701e'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="rounded-xl border border-bf-cream/10 bg-black/18 px-4 py-8 text-sm text-bf-cream/52">
            Ранги появятся после успешной синхронизации competitive профилей.
          </div>
        )}
      </div>

      <div className="glass-panel rounded-xl p-4">
        <div className="mb-4 text-sm font-black uppercase text-slate-100">Топ героев</div>
        {topHeroes.length ? (
          <div className="grid gap-2">
            <div className="grid grid-cols-[minmax(0,1fr)_80px_80px_90px] gap-3 border-b border-bf-cream/10 pb-2 text-[11px] font-black uppercase tracking-wide text-bf-cream/38">
              <span>Герой</span>
              <span>Winrate</span>
              <span>Матчей</span>
              <span>Часы</span>
            </div>
            {topHeroes.map((hero) => (
              <div key={hero.hero} className="grid grid-cols-[minmax(0,1fr)_80px_80px_90px] items-center gap-3 rounded-xl bg-black/18 px-3 py-2 text-sm">
                <div className="flex min-w-0 items-center gap-2">
                  <HeroIcon hero={hero} className="h-7 w-7" />
                  <span className="truncate font-black text-slate-100">{hero.heroLabel}</span>
                </div>
                <div className="font-black text-emerald-300">{formatPercent(hero.winrate)}</div>
                <div className="font-semibold text-bf-cream/72">{formatInteger(hero.matches)}</div>
                <div className="font-semibold text-bf-cream/72">{formatHours(hero.timePlayed)}</div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-bf-cream/10 bg-black/18 px-4 py-8 text-sm text-bf-cream/52">
            Герои появятся после загрузки статистики OverFast.
          </div>
        )}
      </div>
    </section>
  );
}

export default function OverwatchStatsPage({
  stats,
  basePlayers = [],
  isLoading,
  error,
}) {
  const team = stats?.team || {};
  const loadingPlayers = useMemo(() => basePlayers.map(basePlayerToStatsRow), [basePlayers]);
  const players = isLoading ? stats?.players || loadingPlayers : stats?.players || loadingPlayers;
  const showLoadingSummary = isLoading;

  return (
    <>
      <StatsBanner updatedAt={stats?.updatedAt} />
      <section className="glass-panel mt-4 rounded-xl p-4">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <StatSummaryCard
            icon={Trophy}
            label="Средний рейтинг"
            value={showLoadingSummary ? <LoadingStatSummaryValue type="rank" /> : team.averageRank || '—'}
            subLabel={showLoadingSummary ? 'Рейтинг: считается...' : team.averageRating ? `Рейтинг: ${formatInteger(team.averageRating)}` : 'Рейтинг: —'}
            caption="Competitive"
            tone="purple"
          />
          <StatSummaryCard icon={Check} label="Процент побед" value={showLoadingSummary ? <LoadingStatSummaryValue type="percent" /> : formatPercent(team.winrate)} caption="По загруженным игрокам" tone="green" />
          <StatSummaryCard icon={Clock3} label="Все сыграно" value={showLoadingSummary ? <LoadingStatSummaryValue type="hours" /> : formatHours(team.timePlayed)} caption="All-time" tone="orange" />
          <StatSummaryCard icon={BarChart3} label="Матчей сыграно" value={showLoadingSummary ? <LoadingStatSummaryValue type="matches" /> : formatInteger(team.matches || 0)} caption="Competitive" tone="blue" />
        </div>

        <StatsFilterBar />

        {error ? (
          <div className="mt-4 rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-6 text-sm font-semibold text-red-100">
            {error}
          </div>
        ) : stats?.dataEmpty ? (
          <div className="mt-4 rounded-xl border border-bf-orange/25 bg-bf-orange/10 px-4 py-6 text-sm text-bf-cream/74">
            OverFast не вернул доступные данные. Проверьте BattleTag игроков или доступность профилей.
          </div>
        ) : null}

        <PlayerStatsTable players={players} isLoading={isLoading} />
      </section>

      {showLoadingSummary ? <LoadingCharts /> : <StatsCharts stats={stats || {}} />}
    </>
  );
}
