import { Avatar, RoleBadge } from '../../common.jsx';

export default function ResponsivePlayerInline({ player }) {
  return (
    <div className="sfr-player-inline">
      <Avatar src={player.avatarUrl} alt={player.name} fallbackLabel={player.name} className="sfr-player-avatar" />
      <div>
        <strong>{player.name}</strong>
        <RoleBadge role={player.role} color={player.roleColor} className="sfr-player-role" />
      </div>
    </div>
  );
}
