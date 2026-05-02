import {
  AlertTriangle,
  Check,
  Clock3,
  Crosshair,
  MonitorPlay,
  Swords,
  Trophy,
} from 'lucide-react';

export const EVENT_STYLES = {
  scrim: {
    icon: Swords,
    border: 'border-[#56688f]/55',
    bg: 'bg-[#22314d]/80',
    text: 'text-[#b8c7ec]',
    glow: 'shadow-[0_0_12px_rgba(72,88,126,0.14)]',
  },
  competitive: {
    icon: Crosshair,
    border: 'border-[#8a6b4d]/50',
    bg: 'bg-[#3a3028]/80',
    text: 'text-[#e2c19d]',
    glow: 'shadow-[0_0_12px_rgba(138,107,77,0.12)]',
  },
  review: {
    icon: MonitorPlay,
    border: 'border-[#6b5a91]/50',
    bg: 'bg-[#342b4c]/80',
    text: 'text-[#c8b6f2]',
    glow: 'shadow-[0_0_12px_rgba(107,90,145,0.12)]',
  },
  tournament: {
    icon: Trophy,
    border: 'border-[#8d4c45]/50',
    bg: 'bg-[#492a2c]/80',
    text: 'text-[#f0b3a8]',
    glow: 'shadow-[0_0_12px_rgba(141,76,69,0.12)]',
  },
  unavailable: {
    icon: AlertTriangle,
    border: 'border-[#9a4651]/55',
    bg: 'bg-[#612633]/80',
    text: 'text-[#ffc7ce]',
    glow: 'shadow-[0_0_14px_rgba(154,70,81,0.16)]',
  },
  full_day_available: {
    icon: Check,
    border: 'border-[#3f8067]/55',
    bg: 'bg-[#1f513f]/80',
    text: 'text-[#bdebd5]',
    glow: 'shadow-[0_0_12px_rgba(63,128,103,0.14)]',
  },
  tentative: {
    icon: AlertTriangle,
    border: 'border-[#9a6a39]/55',
    bg: 'bg-[#4c3425]/80',
    text: 'text-[#f5c993]',
    glow: 'shadow-[0_0_14px_rgba(154,106,57,0.16)]',
  },
  fallback: {
    icon: Clock3,
    border: 'border-[#556076]/35',
    bg: 'bg-[#202b40]/80',
    text: 'text-[#d7deea]',
    glow: 'shadow-[0_0_10px_rgba(62,73,98,0.12)]',
  },
};

export const AVAILABLE_CARD_STYLE = {
  border: 'border-[#556076]/35',
  bg: 'bg-[#202b40]/80',
  text: 'text-[#e3e9f3]',
  glow: 'shadow-[0_0_10px_rgba(62,73,98,0.12)]',
};

export function timeChoices(startHour, endHour) {
  return Array.from({ length: endHour - startHour + 1 }, (_, index) => {
    const hour = startHour + index;
    return {
      value: hour * 60,
      label: `${String(hour).padStart(2, '0')}:00`,
    };
  });
}

export function discordFeedbackFromUrl(search) {
  const params = new URLSearchParams(search);
  const status = params.get('discord');
  const reason = params.get('reason');
  if (!status) return null;

  if (status === 'connected') {
    return { tone: 'success', text: 'Discord успешно подключен.' };
  }

  if (status === 'disconnected') {
    return { tone: 'success', text: 'Discord отвязан.' };
  }

  if (status === 'error') {
    const messages = {
      'already-linked': 'Этот Discord-аккаунт уже привязан к другому пользователю.',
      'invalid-state': 'Не удалось подтвердить запрос подключения Discord.',
      'missing-code': 'Discord не вернул код подключения.',
      'oauth-failed': 'Не удалось получить данные Discord. Повторите попытку.',
      'not-configured': 'Discord временно недоступен. Обратитесь к администратору.',
      'access_denied': 'Подключение Discord было отменено.',
    };
    return { tone: 'error', text: messages[reason] || 'Не удалось подключить Discord.' };
  }

  return null;
}

export function previewNote(text, maxChars = 15) {
  if (!text) return '';
  const chars = Array.from(text);
  if (chars.length <= maxChars) return text;
  return `${chars.slice(0, maxChars).join('')}...`;
}

export function buildDayEventMap(dayEventTypes = []) {
  const map = new Map();
  dayEventTypes.forEach((dayEvent) => {
    map.set(Number(dayEvent.dayOfWeek), dayEvent);
  });
  return map;
}
