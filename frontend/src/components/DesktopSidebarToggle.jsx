import { FaBars, FaChevronLeft } from 'react-icons/fa';

function DesktopSidebarToggle({ open, onToggle, className = '' }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={`grid h-9 w-9 place-items-center rounded-lg border border-zinc-300 bg-white text-zinc-700 transition hover:bg-zinc-100 ${className}`}
      aria-pressed={open}
      aria-label={open ? 'Ocultar menu lateral' : 'Exibir menu lateral'}
      title={open ? 'Ocultar menu' : 'Exibir menu'}
    >
      {open ? <FaChevronLeft className="text-sm" /> : <FaBars className="text-sm" />}
    </button>
  );
}

export default DesktopSidebarToggle;
