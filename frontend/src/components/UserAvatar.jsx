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
  const frameClass = `inline-grid shrink-0 ${sizeClass} place-items-center overflow-hidden rounded-full ${ringClass}`;

  if (imageUrl) {
    return (
      <img
        src={imageUrl}
        alt={nome ? `Avatar de ${nome}` : 'Avatar'}
        className={`${frameClass} object-cover`}
      />
    );
  }

  if (presetId) {
    return (
      <span className={frameClass} title={nome || undefined}>
        <CartoonAnimalAvatar animalId={presetId} className="h-full w-full" />
      </span>
    );
  }

  return (
    <span
      className={`${frameClass} text-sm font-semibold text-white ${teamStyle.bg}`}
      title={nome || undefined}
    >
      {initials}
    </span>
  );
}

export default UserAvatar;
