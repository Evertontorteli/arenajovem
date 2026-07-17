import { useRef, useState } from 'react';
import { FaPlus } from 'react-icons/fa';
import CartoonAnimalAvatar from './CartoonAnimalAvatar';
import UserAvatar from './UserAvatar';
import http from '../api/http';
import {
  AVATAR_PRESETS,
  buildPresetAvatarValue,
  getPresetAvatarId,
  isPresetAvatar,
} from '../utils/avatarPresets';

function AvatarPicker({ user, foto, onFotoChange, onSaved }) {
  const fileInputRef = useRef(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const selectedPresetId = getPresetAvatarId(foto);
  const hasCustomPhoto = foto && !isPresetAvatar(foto);

  const persistFoto = async (nextFoto) => {
    setSaving(true);
    setError('');
    try {
      const { data } = await http.put('/users/me', { foto: nextFoto });
      onFotoChange(data.foto || nextFoto);
      onSaved?.(data);
    } catch (uploadError) {
      const message =
        uploadError?.response?.data?.message ||
        'Não foi possível atualizar o avatar.';
      setError(message);
    } finally {
      setSaving(false);
    }
  };

  const selectPreset = async (presetId) => {
    if (saving) return;
    await persistFoto(buildPresetAvatarValue(presetId));
  };

  const handleFileChange = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file || saving) return;

    setSaving(true);
    setError('');
    try {
      const formData = new FormData();
      formData.append('foto', file);
      const { data } = await http.post('/users/me/avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      onFotoChange(data.foto);
      onSaved?.(data);
    } catch (uploadError) {
      const message =
        uploadError?.response?.data?.message ||
        'Não foi possível enviar a foto.';
      setError(message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="ig-card grid gap-4 p-4">
      <div>
        <h3 className="text-base font-semibold text-zinc-900">Seu avatar</h3>
        <p className="mt-1 text-sm text-zinc-500">
          Escolha um animal cartoon ou envie uma foto da galeria ou câmera.
        </p>
      </div>

      <div className="flex flex-col items-center gap-3">
        <UserAvatar
          foto={foto}
          nome={user?.nome}
          equipeNome={user?.equipe_nome}
          sizeClass="h-24 w-24"
          ringClass="ring-4 ring-zinc-100"
        />

        <button
          type="button"
          className="grid h-11 w-11 place-items-center rounded-full border border-dashed border-zinc-300 bg-zinc-50 text-lg text-zinc-600 transition hover:border-zinc-400 hover:bg-zinc-100 disabled:opacity-60"
          aria-label="Enviar foto da galeria ou câmera"
          onClick={() => fileInputRef.current?.click()}
          disabled={saving}
        >
          <FaPlus />
        </button>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
        />
      </div>

      <div className="grid grid-cols-4 gap-2 sm:grid-cols-8">
        {AVATAR_PRESETS.map((preset) => {
          const isSelected = selectedPresetId === preset.id && !hasCustomPhoto;

          return (
            <button
              key={preset.id}
              type="button"
              aria-label={`Avatar ${preset.label}`}
              aria-pressed={isSelected}
              disabled={saving}
              onClick={() => selectPreset(preset.id)}
              className={`overflow-hidden rounded-full border-2 transition ${
                isSelected
                  ? 'border-zinc-900 ring-2 ring-zinc-200'
                  : 'border-transparent hover:border-zinc-300'
              }`}
            >
              <CartoonAnimalAvatar animalId={preset.id} className="h-14 w-14 sm:h-16 sm:w-16" />
            </button>
          );
        })}
      </div>

      {saving ? <p className="text-sm text-zinc-500">Salvando avatar...</p> : null}
      {error ? <p className="text-sm text-rose-500">{error}</p> : null}
    </div>
  );
}

export default AvatarPicker;
