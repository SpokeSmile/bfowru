import { NAV_ITEMS } from '../../constants.js';

function SidebarNavItem({ item, isFeedbackOpen }) {
  const isActive = item.active && !isFeedbackOpen;
  const content = (
    <span className="sf-nav-item-surface">
      <img src={`/static/img/schedule/icons/${item.icon}`} alt="" />
      <span>{item.label}</span>
    </span>
  );

  if (!item.href) {
    return (
      <button className="sf-nav-item" type="button" disabled>
        {content}
      </button>
    );
  }

  return (
    <a className={`sf-nav-item ${isActive ? 'sf-nav-item--active' : ''}`} href={item.href}>
      {isActive ? <span className="sf-nav-item-accent" aria-hidden="true" /> : null}
      {content}
    </a>
  );
}

export default function SidebarNav({ isFeedbackOpen }) {
  return (
    <nav className="sf-nav" aria-label="Schedule navigation">
      {NAV_ITEMS.map((item) => (
        <SidebarNavItem item={item} isFeedbackOpen={isFeedbackOpen} key={item.label} />
      ))}
    </nav>
  );
}
