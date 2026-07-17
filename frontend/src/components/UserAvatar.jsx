import CartoonAnimalAvatar from './CartoonAnimalAvatar';
import { getPresetAvatarId, resolveAvatarImageUrl } from '../utils/avatarPresets';
import { getTeamStylesByLabel } from '../utils/teamColors';

function UserAvatar({
  foto,
  nome = '',
  equipeNome,
  sizeClass = 'h-14 w-14',
  ringClass = '',
}) {
  const presetId = getPresetAvatarId(foto);
  const imageUrl = resolveAvatarImageUrl(foto);
  const teamStyle = getTeamStylesByLabel(equipeNome, 'AMARELO');
  const initials = (nome || 'U').trim().charAt(0).toUpperCase();

  if (imageUrl) {
    return (
      <img
        src={imageUrl}
        alt={nome ? `Avatar de ${nome}` : 'Avatar'}
        className={`${sizeClass} rounded-full object-cover ${ringClass}`}
      />
    );
  }

  if (presetId) {
    return (
      <span className={`${sizeClass} overflow-hidden rounded-full ${ringClass}`}>
        <CartoonAnimalAvatar animalId={presetId} className="h-full w-full" />
      </span>
    );
  }

  return (
    <span
      className={`grid ${sizeClass} place-items-center rounded-full text-sm font-semibold text-white ${teamStyle.bg} ${ringClass}`}
    >
      {initials}
    </span>
  );
}

export default UserAvatar;
