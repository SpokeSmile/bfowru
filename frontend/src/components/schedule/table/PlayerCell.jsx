import { Avatar, RoleBadge } from '../../common.jsx';

export default function PlayerCell({ player }) {
  return (
    <div className="sf-player-cell">
      <Avatar src={player.avatarUrl} alt={player.name} fallbackLabel={player.name} className="sf-player-avatar" />
      <div className="sf-player-copy">
        <div className="sf-player-name">{player.name}</div>
        <RoleBadge role={player.role} color={player.roleColor} className="sf-player-role" />
      </div>
    </div>
  );
}
