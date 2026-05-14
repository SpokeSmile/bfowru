import { Avatar } from '../../common.jsx';
import { NAV_ITEMS } from '../constants.js';

export default function ScheduleSidebar({ user }) {
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
              <img src={`/static/img/figma/schedule/icons/${item.icon}`} alt="" />
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

      <a className="sf-sidebar-profile" href="/profile/" aria-label="Open profile">
        <Avatar src={user.avatarUrl} alt={user.username} fallbackLabel={user.username} className="sf-sidebar-avatar" />
        <div>
          <div className="sf-sidebar-profile-name">{user.username}</div>
          <div className="sf-sidebar-profile-subtitle">Team TWIK</div>
        </div>
        <span className="sf-sidebar-profile-arrow">&gt;</span>
      </a>
    </aside>
  );
}
