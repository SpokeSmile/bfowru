import { useEffect, useState } from 'react';

import {
  BEST_CARD_WIDTH,
  CONTROL_CONTENT_WIDTH,
  CONTROL_GAP,
  DATE_CARD_WIDTH,
  DESKTOP_FRAME_HEIGHT,
  DESKTOP_FRAME_WIDTH,
  DESKTOP_LAYOUT_MIN_WIDTH,
  MAIN_LEFT,
  MAIN_WIDTH,
  MOBILE_MAX_WIDTH,
  UPCOMING_CARD_WIDTH,
} from '../constants.js';

function getViewportSize() {
  if (typeof window === 'undefined') {
    return { width: DESKTOP_FRAME_WIDTH, height: DESKTOP_FRAME_HEIGHT };
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
  const scale = Math.max(0.01, Math.min(viewport.width / DESKTOP_FRAME_WIDTH, viewport.height / DESKTOP_FRAME_HEIGHT));
  const frameWidth = Math.max(DESKTOP_FRAME_WIDTH, viewport.width / scale);
  const extraWidth = frameWidth - DESKTOP_FRAME_WIDTH;
  const mainWidth = MAIN_WIDTH + extraWidth;
  const controlWidth = mainWidth - CONTROL_GAP * 2;
  const dateWidth = controlWidth * (DATE_CARD_WIDTH / CONTROL_CONTENT_WIDTH);
  const bestWidth = controlWidth * (BEST_CARD_WIDTH / CONTROL_CONTENT_WIDTH);
  const upcomingWidth = controlWidth * (UPCOMING_CARD_WIDTH / CONTROL_CONTENT_WIDTH);

  return {
    width: viewport.width,
    height: Math.min(viewport.height, DESKTOP_FRAME_HEIGHT * scale),
    scale,
    style: {
      '--sf-frame-width': `${frameWidth}px`,
      '--sf-main-left': `${MAIN_LEFT}px`,
      '--sf-main-width': `${mainWidth}px`,
      '--sf-date-width': `${dateWidth}px`,
      '--sf-best-width': `${bestWidth}px`,
      '--sf-upcoming-width': `${upcomingWidth}px`,
      '--sf-version-left': `${frameWidth - 94}px`,
    },
  };
}

function viewportMode(width) {
  if (width >= DESKTOP_LAYOUT_MIN_WIDTH) return 'desktop';
  if (width <= MOBILE_MAX_WIDTH) return 'mobile';
  return 'compact';
}

export function useScheduleLayout() {
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

export function useScheduleViewport() {
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
