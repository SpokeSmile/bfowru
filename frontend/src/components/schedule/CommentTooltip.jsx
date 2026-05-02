import { useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

export default function CommentTooltip({ tooltip }) {
  const needsEmergencyWrap = /\S{30,}/.test(tooltip.text || '');
  const [position, setPosition] = useState({
    left: 0,
    top: 0,
    placement: tooltip.placement || 'bottom',
  });
  const [maxWidth, setMaxWidth] = useState(Math.min(320, window.innerWidth - 32));
  const [isReady, setIsReady] = useState(false);
  const tooltipRef = useRef(null);

  useLayoutEffect(() => {
    const tooltipNode = tooltipRef.current;
    if (!tooltipNode) return;

    const viewportPadding = 16;
    const offset = 8;
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const desiredMaxWidth = Math.min(320, viewportWidth - viewportPadding * 2);
    setMaxWidth(desiredMaxWidth);

    const tooltipWidth = tooltipNode.offsetWidth;
    const tooltipHeight = tooltipNode.offsetHeight;

    let left = tooltip.anchorRect.left;
    if (left + tooltipWidth > viewportWidth - viewportPadding) {
      left = viewportWidth - viewportPadding - tooltipWidth;
    }
    if (left < viewportPadding) {
      left = viewportPadding;
    }

    let placement = 'bottom';
    let top = tooltip.anchorRect.bottom + offset;

    if (top + tooltipHeight > viewportHeight - viewportPadding) {
      placement = 'top';
      top = tooltip.anchorRect.top - tooltipHeight - offset;
    }

    if (top < viewportPadding) {
      top = Math.max(viewportPadding, viewportHeight - tooltipHeight - viewportPadding);
    }

    setPosition({ left, top, placement });
    setIsReady(true);
  }, [tooltip]);

  return createPortal(
    <div
      ref={(node) => {
        tooltipRef.current = node;
      }}
      className={`comment-tooltip${needsEmergencyWrap ? ' comment-tooltip--force-break' : ''}`}
      style={{
        left: `${position.left}px`,
        top: `${position.top}px`,
        maxWidth: `${maxWidth}px`,
        opacity: isReady ? 1 : 0,
      }}
    >
      {tooltip.text}
    </div>,
    document.body,
  );
}
