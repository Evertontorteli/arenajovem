import { FaBolt, FaFire, FaLeaf, FaTint } from 'react-icons/fa';
import { getTeamThemeByLabel } from '../utils/teamColors';

const TEAM_ICONS = {
  AMARELO: FaBolt,
  AZUL: FaTint,
  VERDE: FaLeaf,
  VERMELHO: FaFire,
};

function TeamElementIcon({ teamName, sizeClass = 'text-2xl', className = '' }) {
  const theme = getTeamThemeByLabel(teamName);
  const Icon = TEAM_ICONS[theme.key] || FaBolt;

  return <Icon className={`${sizeClass} ${className}`} aria-hidden="true" />;
}

export default TeamElementIcon;
