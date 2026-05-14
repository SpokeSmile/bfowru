export const DESKTOP_FRAME_WIDTH = 1920;
export const DESKTOP_FRAME_HEIGHT = 1080;
export const MAIN_LEFT = 366;
export const MAIN_WIDTH = 1400;
export const CONTROL_GAP = 32;
export const DATE_CARD_WIDTH = 540;
export const BEST_CARD_WIDTH = 392;
export const UPCOMING_CARD_WIDTH = 404;
export const CONTROL_CONTENT_WIDTH = DATE_CARD_WIDTH + BEST_CARD_WIDTH + UPCOMING_CARD_WIDTH;
export const DAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
export const MONTH_NAMES = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
export const DESKTOP_LAYOUT_MIN_WIDTH = 1440;
export const MOBILE_MAX_WIDTH = 767;

export const NAV_ITEMS = [
  { label: 'Schedule', href: '/', icon: 'schedule.png', active: true },
  { label: 'Roster', href: '/team/', icon: 'roster.png' },
  { label: 'Updates', href: '/updates/', icon: 'updates.png' },
  { label: 'Analytics', href: '/stats/', icon: 'analytics.png' },
  { label: 'Drafts', href: '', icon: 'drafts.png' },
  { label: 'Management', href: '/profile/', icon: 'management.png' },
];

export const STATUS_META = {
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
