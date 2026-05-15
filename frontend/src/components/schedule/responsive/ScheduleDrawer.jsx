import { useEffect } from 'react';
import { MessageSquareText, X } from 'lucide-react';

import { Avatar } from '../../common.jsx';
import { NAV_ITEMS } from '../constants.js';

export default function ScheduleDrawer({ user, isOpen, isFeedbackOpen = false, onClose, onFeedback }) {
  useEffect(() => {
    if (!isOpen) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  return (
    <div className={`sfr-drawer-layer ${isOpen ? 'sfr-drawer-layer--open' : ''}`} aria-hidden={!isOpen}>
      <button className="sfr-drawer-backdrop" type="button" onClick={onClose} aria-label="Close navigation" />
      <aside className="sfr-drawer" aria-label="Schedule navigation">
        <div className="sfr-drawer-head">
          <img src="/static/img/Logo.png" alt="" />
          <div>
            <strong>BLACK FLOCK</strong>
            <span>TEAM HUB</span>
          </div>
          <button type="button" onClick={onClose} aria-label="Close navigation">
            <X size={20} />
          </button>
        </div>

        <nav className="sfr-drawer-nav">
          {NAV_ITEMS.map((item) => {
            const isActive = item.active && !isFeedbackOpen;
            const content = (
              <>
                <img src={`/static/img/schedule/icons/${item.icon}`} alt="" />
                <span>{item.label}</span>
              </>
            );

            if (!item.href) {
              return (
                <button className="sfr-drawer-nav-item" type="button" disabled key={item.label}>
                  {content}
                </button>
              );
            }

            return (
              <a
                className={`sfr-drawer-nav-item ${isActive ? 'sfr-drawer-nav-item--active' : ''}`}
                href={item.href}
                key={item.label}
                onClick={onClose}
              >
                {content}
              </a>
            );
          })}
          <button
            className={`sfr-drawer-nav-item ${isFeedbackOpen ? 'sfr-drawer-nav-item--active' : ''}`}
            type="button"
            onClick={() => {
              onFeedback();
              onClose();
            }}
          >
            <MessageSquareText size={22} strokeWidth={1.8} />
            <span>Feedback</span>
          </button>
        </nav>

        <a className="sfr-drawer-profile" href="/profile/" onClick={onClose}>
          <Avatar src={user.avatarUrl} alt={user.username} fallbackLabel={user.username} className="sfr-drawer-avatar" />
          <div>
            <strong>{user.username}</strong>
            <span>Open profile</span>
          </div>
        </a>
      </aside>
    </div>
  );
}
