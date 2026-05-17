import { ChevronUp, LogOut, MessageSquareText, UserRound } from 'lucide-react';
import { useState } from 'react';

import { logout } from '../../../../api.js';
import { Avatar } from '../../../common.jsx';

export default function SidebarProfileMenu({ user, onFeedback, isFeedbackOpen = false }) {
  const [isOpen, setIsOpen] = useState(false);

  async function handleLogout() {
    const response = await logout();
    window.location.href = response.redirectUrl || '/login/';
  }

  return (
    <div className={`sf-sidebar-profile ${isOpen ? 'sf-sidebar-profile--open' : ''}`}>
      <div className="sf-sidebar-profile-panel" aria-hidden={!isOpen}>
        <div className="sf-sidebar-profile-actions">
          <a className="sf-sidebar-profile-action" href="/profile/">
            <UserRound size={21} strokeWidth={1.8} />
            <span>Profile</span>
          </a>
          <button
            className={`sf-sidebar-profile-action ${isFeedbackOpen ? 'sf-sidebar-profile-action--active' : ''}`}
            type="button"
            onClick={onFeedback}
          >
            <MessageSquareText size={21} strokeWidth={1.8} />
            <span>Feedback</span>
          </button>
          <button className="sf-sidebar-profile-action sf-sidebar-profile-action--exit" type="button" onClick={handleLogout}>
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
        onClick={() => setIsOpen((value) => !value)}
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
