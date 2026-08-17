interface LogoProps {
  /** Só o ícone (prédio + documento), sem o nome escrito ao lado. */
  markOnly?: boolean;
  className?: string;
}

export function LogoMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 200 160"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <path
        d="M30 150 L30 70 L70 20 L110 70 L110 150"
        stroke="currentColor"
        strokeWidth="8"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      <path d="M30 100 L110 100" stroke="currentColor" strokeWidth="8" strokeLinecap="round" />
      <path
        d="M110 150 L110 60 L148 60 L170 82 L170 150 Z"
        stroke="currentColor"
        strokeWidth="8"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      <path
        d="M148 60 L148 82 L170 82"
        stroke="currentColor"
        strokeWidth="8"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      <path d="M122 112 L158 112" stroke="currentColor" strokeWidth="8" strokeLinecap="round" />
      <path d="M122 128 L158 128" stroke="currentColor" strokeWidth="8" strokeLinecap="round" />
    </svg>
  );
}

export function Logo({ markOnly, className }: LogoProps) {
  if (markOnly) {
    return <LogoMark className={className} />;
  }

  return (
    <div className={`flex items-center gap-2 ${className ?? ""}`}>
      <LogoMark className="h-8 w-8 shrink-0 text-light-text dark:text-dark-text" />
      <span className="text-lg font-bold tracking-tight text-light-text dark:text-dark-text">CONDOMINUS</span>
    </div>
  );
}
