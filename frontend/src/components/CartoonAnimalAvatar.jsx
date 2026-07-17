const ANIMALS = {
  cat: (
    <>
      <circle cx="32" cy="34" r="22" fill="#FDBA74" />
      <polygon points="14,18 22,28 10,28" fill="#FDBA74" />
      <polygon points="50,18 42,28 54,28" fill="#FDBA74" />
      <circle cx="24" cy="32" r="3" fill="#1F2937" />
      <circle cx="40" cy="32" r="3" fill="#1F2937" />
      <path d="M28 40 Q32 44 36 40" stroke="#1F2937" strokeWidth="2" fill="none" strokeLinecap="round" />
      <line x1="18" y1="36" x2="10" y2="34" stroke="#FB923C" strokeWidth="2" strokeLinecap="round" />
      <line x1="18" y1="40" x2="10" y2="40" stroke="#FB923C" strokeWidth="2" strokeLinecap="round" />
      <line x1="46" y1="36" x2="54" y2="34" stroke="#FB923C" strokeWidth="2" strokeLinecap="round" />
      <line x1="46" y1="40" x2="54" y2="40" stroke="#FB923C" strokeWidth="2" strokeLinecap="round" />
    </>
  ),
  dog: (
    <>
      <ellipse cx="32" cy="36" rx="24" ry="20" fill="#D97706" />
      <ellipse cx="14" cy="30" rx="8" ry="12" fill="#B45309" />
      <ellipse cx="50" cy="30" rx="8" ry="12" fill="#B45309" />
      <circle cx="24" cy="32" r="3" fill="#1F2937" />
      <circle cx="40" cy="32" r="3" fill="#1F2937" />
      <ellipse cx="32" cy="40" rx="6" ry="4" fill="#451A03" />
      <path d="M32 44 Q36 48 40 44" stroke="#1F2937" strokeWidth="2" fill="none" strokeLinecap="round" />
    </>
  ),
  bear: (
    <>
      <circle cx="32" cy="34" r="22" fill="#92400E" />
      <circle cx="14" cy="18" r="8" fill="#92400E" />
      <circle cx="50" cy="18" r="8" fill="#92400E" />
      <circle cx="14" cy="18" r="4" fill="#FBBF24" />
      <circle cx="50" cy="18" r="4" fill="#FBBF24" />
      <ellipse cx="32" cy="38" rx="8" ry="6" fill="#FBBF24" />
      <circle cx="24" cy="30" r="3" fill="#1F2937" />
      <circle cx="40" cy="30" r="3" fill="#1F2937" />
      <circle cx="32" cy="36" r="2.5" fill="#1F2937" />
    </>
  ),
  fox: (
    <>
      <polygon points="32,10 48,34 16,34" fill="#F97316" />
      <polygon points="32,16 42,32 22,32" fill="#FFEDD5" />
      <circle cx="26" cy="28" r="3" fill="#1F2937" />
      <circle cx="38" cy="28" r="3" fill="#1F2937" />
      <path d="M30 34 L32 38 L34 34" fill="#1F2937" />
      <path d="M28 36 Q32 40 36 36" stroke="#1F2937" strokeWidth="2" fill="none" strokeLinecap="round" />
    </>
  ),
  rabbit: (
    <>
      <ellipse cx="24" cy="14" rx="6" ry="16" fill="#F9A8D4" />
      <ellipse cx="40" cy="14" rx="6" ry="16" fill="#F9A8D4" />
      <ellipse cx="24" cy="14" rx="3" ry="10" fill="#FBCFE8" />
      <ellipse cx="40" cy="14" rx="3" ry="10" fill="#FBCFE8" />
      <circle cx="32" cy="36" r="18" fill="#F9A8D4" />
      <circle cx="26" cy="34" r="3" fill="#1F2937" />
      <circle cx="38" cy="34" r="3" fill="#1F2937" />
      <path d="M28 42 Q32 46 36 42" stroke="#BE185D" strokeWidth="2" fill="none" strokeLinecap="round" />
    </>
  ),
  panda: (
    <>
      <circle cx="32" cy="34" r="22" fill="#FFFFFF" stroke="#E5E7EB" strokeWidth="2" />
      <circle cx="14" cy="18" r="8" fill="#111827" />
      <circle cx="50" cy="18" r="8" fill="#111827" />
      <ellipse cx="24" cy="30" rx="7" ry="8" fill="#111827" />
      <ellipse cx="40" cy="30" rx="7" ry="8" fill="#111827" />
      <circle cx="24" cy="32" r="2.5" fill="#FFFFFF" />
      <circle cx="40" cy="32" r="2.5" fill="#FFFFFF" />
      <ellipse cx="32" cy="40" rx="5" ry="4" fill="#111827" />
    </>
  ),
  lion: (
    <>
      <circle cx="32" cy="34" r="26" fill="#FBBF24" />
      <circle cx="32" cy="34" r="18" fill="#FDE68A" />
      <circle cx="24" cy="30" r="3" fill="#1F2937" />
      <circle cx="40" cy="30" r="3" fill="#1F2937" />
      <path d="M28 40 Q32 44 36 40" stroke="#1F2937" strokeWidth="2" fill="none" strokeLinecap="round" />
      <circle cx="16" cy="20" r="4" fill="#F59E0B" />
      <circle cx="48" cy="20" r="4" fill="#F59E0B" />
      <circle cx="32" cy="12" r="4" fill="#F59E0B" />
      <circle cx="12" cy="34" r="4" fill="#F59E0B" />
      <circle cx="52" cy="34" r="4" fill="#F59E0B" />
    </>
  ),
  owl: (
    <>
      <ellipse cx="32" cy="36" rx="22" ry="24" fill="#7C3AED" />
      <circle cx="24" cy="30" r="9" fill="#F5F3FF" />
      <circle cx="40" cy="30" r="9" fill="#F5F3FF" />
      <circle cx="24" cy="30" r="4" fill="#1F2937" />
      <circle cx="40" cy="30" r="4" fill="#1F2937" />
      <path d="M32 38 L28 44 L36 44 Z" fill="#F59E0B" />
      <path d="M18 18 L24 24" stroke="#6D28D9" strokeWidth="3" strokeLinecap="round" />
      <path d="M46 18 L40 24" stroke="#6D28D9" strokeWidth="3" strokeLinecap="round" />
    </>
  ),
};

function CartoonAnimalAvatar({ animalId, className = 'h-full w-full' }) {
  const content = ANIMALS[animalId] || ANIMALS.cat;

  return (
    <svg
      viewBox="0 0 64 64"
      className={className}
      role="img"
      aria-hidden="true"
    >
      <rect width="64" height="64" rx="32" fill="#F4F4F5" />
      {content}
    </svg>
  );
}

export default CartoonAnimalAvatar;
