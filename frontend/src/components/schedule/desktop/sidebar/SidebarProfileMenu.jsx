import { ChevronUp, LogOut, MessageSquareText, UserRound } from 'lucide-react';
import { useState } from 'react';

import { logout } from '../../../../api.js';
import { Avatar } from '../../../common.jsx';

export default function SidebarProfileMenu({ user, onFeedback, isFeedbackOpen = false }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  async function handleLogout() {
    if (isAnimating) return;
    const response = await logout();
    window.location.href = response.redirectUrl || '/login/';
  }

  function handleFeedback() {
    if (isAnimating) return;
    onFeedback();
  }

  function handleProfileClick(event) {
    if (isAnimating) event.preventDefault();
  }

  function toggleProfile() {
    setIsAnimating(true);
    setIsOpen((value) => !value);
  }

  function handleTransitionEnd(event) {
    if (event.target === event.currentTarget && event.propertyName === 'height') {
      setIsAnimating(false);
    }
  }

  return (
    <div
      className={`sf-sidebar-profile ${isOpen ? 'sf-sidebar-profile--open' : ''} ${isAnimating ? 'sf-sidebar-profile--animating' : ''}`}
      onTransitionEnd={handleTransitionEnd}
    >
      <div className="sf-sidebar-profile-panel" aria-hidden={!isOpen}>
        <div className="sf-sidebar-profile-actions">
          <a
            className="sf-sidebar-profile-action"
            href="/profile/"
            aria-disabled={isAnimating}
            tabIndex={isAnimating ? -1 : undefined}
            onClick={handleProfileClick}
          >
            <UserRound size={21} strokeWidth={1.8} />
            <span>Profile</span>
          </a>
          <button
            className={`sf-sidebar-profile-action ${isFeedbackOpen ? 'sf-sidebar-profile-action--active' : ''}`}
            type="button"
            disabled={isAnimating}
            onClick={handleFeedback}
          >
            <MessageSquareText size={21} strokeWidth={1.8} />
            <span>Feedback</span>
          </button>
          <button
            className="sf-sidebar-profile-action sf-sidebar-profile-action--exit"
            type="button"
            disabled={isAnimating}
            onClick={handleLogout}
          >
            <LogOut size={22} strokeWidth={1.8} />
            <span>Exit</span>
          </button>
        </div>
      </div>

      <button
        className="sf-sidebar-profile-toggle"
        type="button"
        aria-expanded={isOpen}
        aria-label={isOpen ? 'Close profile menu' : 'Open profile menu'}
        onClick={toggleProfile}
      >
        <Avatar src={user.avatarUrl} alt={user.username} fallbackLabel={user.username} className="sf-sidebar-avatar" />
        <div>
          <div className="sf-sidebar-profile-name">{user.username}</div>
          <div className="sf-sidebar-profile-subtitle">Team TWIK</div>
        </div>
        <ChevronUp className="sf-sidebar-profile-arrow" size={26} strokeWidth={2.4} />
      </button>
    </div>
  );
}
