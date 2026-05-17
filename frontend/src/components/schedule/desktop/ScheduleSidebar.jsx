import SidebarBrand from './sidebar/SidebarBrand.jsx';
import SidebarNav from './sidebar/SidebarNav.jsx';
import SidebarProfileMenu from './sidebar/SidebarProfileMenu.jsx';
import SidebarTeamCard from './sidebar/SidebarTeamCard.jsx';

export default function ScheduleSidebar({ user, onFeedback, isFeedbackOpen = false }) {
  return (
    <aside className="sf-sidebar">
      <div className="sf-sidebar-content">
        <SidebarBrand />
        <SidebarTeamCard />
        <SidebarNav isFeedbackOpen={isFeedbackOpen} />
      </div>
      <SidebarProfileMenu user={user} onFeedback={onFeedback} isFeedbackOpen={isFeedbackOpen} />
    </aside>
  );
}
