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
      <circle cx="12" cy="12" r="5" stroke="currentColor" strokeWidth="1.8" />
      <path
        d="M12 1.5v3M12 19.5v3M22.5 12h-3M4.5 12h-3M19.4 4.6l-2.1 2.1M6.7 17.3l-2.1 2.1M19.4 19.4l-2.1-2.1M6.7 6.7L4.6 4.6"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function IconCalendar(props) {
  return (
    <svg {...common} {...props}>
      <rect x="3" y="5" width="18" height="16" rx="3" stroke="currentColor" strokeWidth="1.8" />
      <path d="M3 10h18M8 2.5v5M16 2.5v5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <circle cx="12" cy="15.5" r="2" fill="currentColor" />
    </svg>
  );
}

export function IconHeart(props) {
  return (
    <svg {...common} {...props}>
      <circle cx="8.5" cy="9" r="3.6" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="16" cy="10.5" r="2.8" stroke="currentColor" strokeWidth="1.8" />
      <path d="M2.5 20.5c0-3.6 2.9-6 6-6s6 2.4 6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M14 15.2c2.6 .3 4.6 2.3 4.6 5.3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

export function IconSettings(props) {
  return (
    <svg {...common} {...props}>
      <circle cx="12" cy="12" r="3.4" stroke="currentColor" strokeWidth="1.8" />
      <path
        d="M12 2.5v2.6M12 18.9v2.6M21.5 12h-2.6M5.1 12H2.5M18.4 5.6l-1.9 1.9M7.5 16.5l-1.9 1.9M18.4 18.4l-1.9-1.9M7.5 7.5L5.6 5.6"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}
