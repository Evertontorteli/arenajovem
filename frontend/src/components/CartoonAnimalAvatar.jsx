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
  tiger: (
    <>
      <circle cx="32" cy="34" r="22" fill="#FB923C" />
      <ellipse cx="18" cy="18" rx="7" ry="9" fill="#FB923C" />
      <ellipse cx="46" cy="18" rx="7" ry="9" fill="#FB923C" />
      <path d="M22 20 L22 28" stroke="#1F2937" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M42 20 L42 28" stroke="#1F2937" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M32 18 L32 26" stroke="#1F2937" strokeWidth="2.5" strokeLinecap="round" />
      <circle cx="24" cy="32" r="3" fill="#1F2937" />
      <circle cx="40" cy="32" r="3" fill="#1F2937" />
      <ellipse cx="32" cy="40" rx="5" ry="3.5" fill="#FDBA74" />
      <path d="M28 46 Q32 50 36 46" stroke="#1F2937" strokeWidth="2" fill="none" strokeLinecap="round" />
    </>
  ),
  wolf: (
    <>
      <circle cx="32" cy="36" r="20" fill="#9CA3AF" />
      <polygon points="14,22 22,30 12,32" fill="#9CA3AF" />
      <polygon points="50,22 42,30 52,32" fill="#9CA3AF" />
      <polygon points="14,22 20,28 14,30" fill="#6B7280" />
      <polygon points="50,22 44,28 50,30" fill="#6B7280" />
      <ellipse cx="32" cy="42" rx="10" ry="8" fill="#E5E7EB" />
      <circle cx="24" cy="34" r="3" fill="#1F2937" />
      <circle cx="40" cy="34" r="3" fill="#1F2937" />
      <path d="M30 42 L32 46 L34 42" fill="#1F2937" />
      <path d="M28 48 Q32 52 36 48" stroke="#1F2937" strokeWidth="2" fill="none" strokeLinecap="round" />
    </>
  ),
  monkey: (
    <>
      <circle cx="32" cy="34" r="22" fill="#A16207" />
      <ellipse cx="14" cy="28" rx="8" ry="10" fill="#A16207" />
      <ellipse cx="50" cy="28" rx="8" ry="10" fill="#A16207" />
      <ellipse cx="14" cy="28" rx="4" ry="6" fill="#FDE68A" />
      <ellipse cx="50" cy="28" rx="4" ry="6" fill="#FDE68A" />
      <ellipse cx="32" cy="40" rx="14" ry="12" fill="#FDE68A" />
      <circle cx="24" cy="34" r="3" fill="#1F2937" />
      <circle cx="40" cy="34" r="3" fill="#1F2937" />
      <ellipse cx="32" cy="42" rx="4" ry="3" fill="#92400E" />
      <path d="M28 48 Q32 52 36 48" stroke="#92400E" strokeWidth="2" fill="none" strokeLinecap="round" />
    </>
  ),
  penguin: (
    <>
      <ellipse cx="32" cy="36" rx="20" ry="24" fill="#1F2937" />
      <ellipse cx="32" cy="40" rx="14" ry="16" fill="#FFFFFF" />
      <circle cx="24" cy="30" r="3.5" fill="#FFFFFF" />
      <circle cx="40" cy="30" r="3.5" fill="#FFFFFF" />
      <circle cx="24" cy="30" r="2" fill="#1F2937" />
      <circle cx="40" cy="30" r="2" fill="#1F2937" />
      <path d="M32 34 L28 40 L36 40 Z" fill="#F59E0B" />
      <ellipse cx="14" cy="40" rx="5" ry="8" fill="#1F2937" />
      <ellipse cx="50" cy="40" rx="5" ry="8" fill="#1F2937" />
    </>
  ),
  koala: (
    <>
      <circle cx="14" cy="22" r="12" fill="#9CA3AF" />
      <circle cx="50" cy="22" r="12" fill="#9CA3AF" />
      <circle cx="14" cy="22" r="6" fill="#F9A8D4" />
      <circle cx="50" cy="22" r="6" fill="#F9A8D4" />
      <circle cx="32" cy="36" r="20" fill="#D1D5DB" />
      <circle cx="24" cy="34" r="3" fill="#1F2937" />
      <circle cx="40" cy="34" r="3" fill="#1F2937" />
      <ellipse cx="32" cy="42" rx="6" ry="5" fill="#9CA3AF" />
      <circle cx="32" cy="40" r="2" fill="#1F2937" />
    </>
  ),
  frog: (
    <>
      <ellipse cx="32" cy="40" rx="22" ry="18" fill="#4ADE80" />
      <circle cx="20" cy="24" r="10" fill="#4ADE80" />
      <circle cx="44" cy="24" r="10" fill="#4ADE80" />
      <circle cx="20" cy="24" r="5" fill="#FFFFFF" />
      <circle cx="44" cy="24" r="5" fill="#FFFFFF" />
      <circle cx="20" cy="24" r="2.5" fill="#1F2937" />
      <circle cx="44" cy="24" r="2.5" fill="#1F2937" />
      <path d="M24 44 Q32 50 40 44" stroke="#166534" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      <ellipse cx="18" cy="48" rx="6" ry="4" fill="#22C55E" />
      <ellipse cx="46" cy="48" rx="6" ry="4" fill="#22C55E" />
    </>
  ),
  chick: (
    <>
      <circle cx="32" cy="36" r="20" fill="#FDE047" />
      <circle cx="24" cy="32" r="3" fill="#1F2937" />
      <circle cx="40" cy="32" r="3" fill="#1F2937" />
      <path d="M32 36 L26 42 L38 42 Z" fill="#F97316" />
      <path d="M20 20 Q24 14 28 20" stroke="#FACC15" strokeWidth="3" fill="none" strokeLinecap="round" />
      <ellipse cx="18" cy="44" rx="6" ry="4" fill="#FACC15" />
      <ellipse cx="46" cy="44" rx="6" ry="4" fill="#FACC15" />
      <circle cx="48" cy="22" r="5" fill="#F97316" />
    </>
  ),
  pig: (
    <>
      <circle cx="32" cy="34" r="22" fill="#FDA4AF" />
      <ellipse cx="16" cy="20" rx="7" ry="9" fill="#FDA4AF" />
      <ellipse cx="48" cy="20" rx="7" ry="9" fill="#FDA4AF" />
      <ellipse cx="16" cy="20" rx="3" ry="5" fill="#FECDD3" />
      <ellipse cx="48" cy="20" rx="3" ry="5" fill="#FECDD3" />
      <circle cx="24" cy="30" r="3" fill="#1F2937" />
      <circle cx="40" cy="30" r="3" fill="#1F2937" />
      <ellipse cx="32" cy="42" rx="10" ry="8" fill="#FB7185" />
      <circle cx="28" cy="42" r="2" fill="#BE123C" />
      <circle cx="36" cy="42" r="2" fill="#BE123C" />
    </>
  ),
  unicorn: (
    <>
      <circle cx="32" cy="38" r="20" fill="#F5F3FF" />
      <polygon points="32,6 36,28 28,28" fill="#C4B5FD" />
      <polygon points="32,10 34,26 30,26" fill="#DDD6FE" />
      <ellipse cx="18" cy="24" rx="5" ry="12" fill="#F5F3FF" />
      <ellipse cx="46" cy="24" rx="5" ry="12" fill="#F5F3FF" />
      <ellipse cx="18" cy="24" rx="2" ry="7" fill="#F9A8D4" />
      <ellipse cx="46" cy="24" rx="2" ry="7" fill="#F9A8D4" />
      <circle cx="24" cy="36" r="3" fill="#1F2937" />
      <circle cx="40" cy="36" r="3" fill="#1F2937" />
      <path d="M28 44 Q32 48 36 44" stroke="#A78BFA" strokeWidth="2" fill="none" strokeLinecap="round" />
      <circle cx="20" cy="16" r="2" fill="#F472B6" />
      <circle cx="44" cy="14" r="2" fill="#38BDF8" />
    </>
  ),
  dolphin: (
    <>
      <ellipse cx="32" cy="36" rx="24" ry="18" fill="#38BDF8" />
      <ellipse cx="32" cy="40" rx="16" ry="10" fill="#E0F2FE" />
      <path d="M48 20 Q58 16 54 28" fill="#0EA5E9" />
      <circle cx="22" cy="32" r="3" fill="#1F2937" />
      <path d="M14 36 Q8 40 14 44" stroke="#0284C7" strokeWidth="3" fill="none" strokeLinecap="round" />
      <path d="M18 40 Q22 44 26 40" stroke="#0284C7" strokeWidth="2" fill="none" strokeLinecap="round" />
      <ellipse cx="10" cy="48" rx="8" ry="5" fill="#0EA5E9" />
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
