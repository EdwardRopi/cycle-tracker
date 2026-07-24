const common = {
  width: 22,
  height: 22,
  viewBox: '0 0 24 24',
  fill: 'none',
  xmlns: 'http://www.w3.org/2000/svg',
};

export function IconToday(props) {
  return (
    <svg {...common} {...props}>
      <path
        d="M12 3.2c.55 3.1 1.75 5.5 3.7 7.1 1.95 1.6 4.2 2.4 5.1 2.7-.9.3-3.15 1.1-5.1 2.7-1.95 1.6-3.15 4-3.7 7.1-.55-3.1-1.75-5.5-3.7-7.1C6.35 14 4.1 13.2 3.2 12.9c.9-.3 3.15-1.1 5.1-2.7C10.25 8.6 11.45 6.3 12 3.2Z"
        fill="currentColor"
      />
    </svg>
  );
}

export function IconCalendar(props) {
  return (
    <svg {...common} {...props}>
      <rect x="4" y="5.3" width="16" height="15.2" rx="4.2" stroke="currentColor" strokeWidth="1.7" />
      <path d="M8.2 3.4v4M15.8 3.4v4M4.15 10.1h15.7" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      <circle cx="12" cy="15.3" r="1.5" fill="currentColor" />
    </svg>
  );
}

export function IconHeart(props) {
  return (
    <svg {...common} {...props}>
      <path
        d="M12 20.1s-7.15-4.45-9.55-8.8C.85 7.9 1.85 4.7 4.75 3.55c2.15-.85 4.5 0 5.75 1.95.3.45.45.85.5 1.05.05-.2.2-.6.5-1.05C12.75 3.5 15.1 2.65 17.25 3.5c2.9 1.15 3.9 4.35 2.3 7.75-2.4 4.35-9.55 8.85-9.55 8.85Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function IconSettings(props) {
  return (
    <svg {...common} {...props}>
      <path d="M4 7.2h9.2M17.4 7.2h2.6M4 17h2.6M10.8 17h9.2" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      <circle cx="15.4" cy="7.2" r="2.3" stroke="currentColor" strokeWidth="1.7" fill="var(--glass-bg-strong)" />
      <circle cx="8.6" cy="17" r="2.3" stroke="currentColor" strokeWidth="1.7" fill="var(--glass-bg-strong)" />
    </svg>
  );
}
