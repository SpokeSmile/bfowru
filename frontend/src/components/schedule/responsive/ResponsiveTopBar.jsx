import { Menu } from 'lucide-react';

import { Avatar } from '../../common.jsx';
import useClocks from '../hooks/useClocks.js';

function ResponsiveClockStrip() {
  const clocks = useClocks();
  const entries = [
    ['UTC', clocks.utc],
    ['YOUR', clocks.local],
    ['CET', clocks.cet],
  ];

  return (
    <div className="sfr-clocks" aria-label="World clocks">
      {entries.map(([label, value]) => {
        const isActive = label === 'YOUR';

        return (
          <div className={`sfr-clock-wrap ${isActive ? 'sfr-clock-wrap--active' : ''}`} key={label}>
            {isActive ? <span className="sfr-clock-accent" aria-hidden="true" /> : null}
            <div className={`sfr-clock ${isActive ? 'sfr-clock--active' : ''}`}>
              <span>{label}</span>
              <strong>{value}</strong>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function ResponsiveTopBar({ user, onMenuOpen }) {
  return (
    <header className="sfr-topbar">
      <button className="sfr-menu-button" type="button" onClick={onMenuOpen} aria-label="Open navigation">
        <Menu size={22} />
      </button>
      <a className="sfr-brand" href="/">
        <img src="/static/img/Logo.png" alt="" />
        <span>BLACK FLOCK</span>
      </a>
      <ResponsiveClockStrip />
      <a className="sfr-user" href="/profile/">
        <Avatar src={user.avatarUrl} alt={user.username} fallbackLabel={user.username} className="sfr-user-avatar" />
        <span>{user.username}</span>
      </a>
    </header>
  );
}
