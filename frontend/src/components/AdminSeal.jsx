function AdminSeal({ className = 'h-5 w-5' }) {
  return (
    <svg
      className={className}
      viewBox="0 0 40 40"
      role="img"
      aria-label="Conta verificada de administrador"
    >
      <circle cx="20" cy="20" r="20" fill="#0095F6" />
      <path
        d="M17.1 26.4 11.2 20.5l2.1-2.1 3.8 3.8 9-9 2.1 2.1-11.1 11.1z"
        fill="#fff"
      />
    </svg>
  );
}

export default AdminSeal;
