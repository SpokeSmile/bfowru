import { ChevronUp, LogOut, UserRound } from 'lucide-react';
import { useState } from 'react';

import { logout } from '../../../api.js';
import { Avatar } from '../../common.jsx';
import { NAV_ITEMS } from '../constants.js';

export default function ScheduleSidebar({ user }) {
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  async function handleLogout() {
    const response = await logout();
    window.location.href = response.redirectUrl || '/login/';
  }

  return (
    <aside className="sf-sidebar">
      <div className="sf-sidebar-top">
        <img className="sf-sidebar-mark" src="/static/img/Logo.png" alt="" />
        <div className="sf-sidebar-brand">
          <span>MANAGE</span>
          <span>
            YOU <b>TEAM</b>
          </span>
        </div>
      </div>

      <div className="sf-team-logo-box">
        <span>TEAM</span>
        <span>LOGO</span>
      </div>

      <nav className="sf-nav" aria-label="Schedule navigation">
        {NAV_ITEMS.map((item) => {
          const content = (
            <span className="sf-nav-item-surface">
              <img src={`/static/img/schedule/icons/${item.icon}`} alt="" />
              <span>{item.label}</span>
            </span>
          );

          if (!item.href) {
            return (
              <button className="sf-nav-item" type="button" disabled key={item.label}>
                {content}
              </button>
            );
          }

          return (
            <a className={`sf-nav-item ${item.active ? 'sf-nav-item--active' : ''}`} href={item.href} key={item.label}>
              {item.active ? <span className="sf-nav-item-accent" aria-hidden="true" /> : null}
              {content}
            </a>
          );
        })}
      </nav>

      <div className={`sf-sidebar-profile ${isProfileOpen ? 'sf-sidebar-profile--open' : ''}`}>
        <div className="sf-sidebar-profile-panel" aria-hidden={!isProfileOpen}>
          <a className="sf-sidebar-profile-action" href="/profile/">
            <UserRound size={22} strokeWidth={1.8} />
            <span>Profile</span>
          </a>
          <button className="sf-sidebar-profile-action sf-sidebar-profile-action--exit" type="button" onClick={handleLogout}>
            <LogOut size={23} strokeWidth={1.8} />
            <span>Exit</span>
          </button>
        </div>

        <button
          className="sf-sidebar-profile-toggle"
          type="button"
          aria-expanded={isProfileOpen}
          aria-label={isProfileOpen ? 'Close profile menu' : 'Open profile menu'}
          onClick={() => setIsProfileOpen((value) => !value)}
        >
          <Avatar src={user.avatarUrl} alt={user.username} fallbackLabel={user.username} className="sf-sidebar-avatar" />
          <div>
            <div className="sf-sidebar-profile-name">{user.username}</div>
            <div className="sf-sidebar-profile-subtitle">Team TWIK</div>
          </div>
          <ChevronUp className="sf-sidebar-profile-arrow" size={26} strokeWidth={2.4} />
        </button>
      </div>
    </aside>
  );
}
