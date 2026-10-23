const ICONS = {
  decks: (
    <>
      <rect x="4" y="5" width="13" height="10" rx="2" />
      <path d="M7 18h12a2 2 0 0 0 2-2V8" />
    </>
  ),
  agent: (
    <>
      <path d="M12 3l1.2 3.6L17 8l-3.8 1.2L12 13l-1.2-3.8L7 8l3.8-1.4L12 3z" />
      <path d="M19 13l.7 2.1L22 16l-2.3.7L19 19l-.7-2.3L16 16l2.3-.9L19 13z" />
      <path d="M6 14l.6 1.8L8.5 16.5 6.6 17.2 6 19l-.6-1.8L3.5 16.5 5.4 15.8 6 14z" />
    </>
  ),
  groups: (
    <>
      <path d="M3 8a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8z" />
    </>
  ),
  library: (
    <>
      <rect x="8" y="3.5" width="12" height="9" rx="2" strokeDasharray="2.4 2" />
      <rect x="4" y="9.5" width="12" height="11" rx="2" />
      <path d="M7 13.5h6" />
      <path d="M7 16.5h4" />
    </>
  ),
  mix: (
    <>
      <rect x="3" y="8" width="12" height="10" rx="2" />
      <rect x="9" y="4" width="12" height="10" rx="2" />
    </>
  ),
  classes: (
    <>
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </>
  ),
  teacher: (
    <>
      <path d="M4 19h16" />
      <path d="M4 19V7l8-3 8 3v12" />
      <path d="M9 19v-5h6v5" />
      <path d="M12 10v.01" />
    </>
  ),
  student: (
    <>
      <path d="M4 10l8-4 8 4-8 4-8-4z" />
      <path d="M20 10v5" />
      <path d="M6 12.5V16c0 1.5 2.7 3 6 3s6-1.5 6-3v-3.5" />
    </>
  ),
  speech: (
    <>
      <path d="M12 3a3 3 0 0 1 3 3v6a3 3 0 0 1-6 0V6a3 3 0 0 1 3-3z" />
      <path d="M5 11a7 7 0 0 0 14 0" />
      <path d="M12 18v3" />
      <path d="M8 21h8" />
    </>
  ),
  script: (
    <>
      <path d="M7 3h8l4 4v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z" />
      <path d="M15 3v4h4" />
      <path d="M8 12h8" />
      <path d="M8 16h5" />
      <path d="M8 8h3" />
    </>
  ),
  cloze: (
    <>
      <path d="M4 8h6" />
      <path d="M14 8h6" />
      <path d="M4 12h16" />
      <path d="M4 16h10" />
      <path d="M10.5 6.5h3" strokeDasharray="1.2 1.6" />
    </>
  ),
  joinCode: (
    <>
      <rect x="3" y="7" width="18" height="12" rx="2" />
      <path d="M7 11h4" />
      <path d="M7 15h10" />
      <path d="M15 11h2" />
    </>
  ),
  deckCopy: (
    <>
      <rect x="8" y="4" width="12" height="14" rx="2" />
      <path d="M6 8H5a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-1" />
    </>
  ),
  pro: (
    <>
      <path d="M12 3l2.4 4.9 5.4.8-3.9 3.8.9 5.4L12 15.8 6.2 17.9l.9-5.4L3.2 8.7l5.4-.8L12 3z" />
    </>
  ),
  settings: (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06-.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09A1.65 1.65 0 0 0 15 4.6a1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </>
  ),
  share: (
    <>
      <circle cx="18" cy="5" r="3" />
      <circle cx="6" cy="12" r="3" />
      <circle cx="18" cy="19" r="3" />
      <path d="M8.59 13.51l6.83 3.98" />
      <path d="M15.41 6.51l-6.82 3.98" />
    </>
  ),
  trash: (
    <>
      <path d="M4 7h16" />
      <path d="M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
      <path d="M6 7l1 13h10l1-13" />
      <path d="M10 11v6" />
      <path d="M14 11v6" />
    </>
  ),
  listen: (
    <>
      <path d="M4 13a8 8 0 0 1 16 0" />
      <rect x="3" y="13" width="4.5" height="7" rx="1.6" />
      <rect x="16.5" y="13" width="4.5" height="7" rx="1.6" />
    </>
  ),
  studio: (
    <>
      <path d="M4 6.5h9a2 2 0 0 1 2 2V14H8l-4 3V8.5a2 2 0 0 1 2-2z" />
      <path d="M15 9.5h5a2 2 0 0 1 2 2V19l-3.5-2.5H15V9.5z" />
    </>
  ),
  practice: (
    <>
      <path d="M4 6.5h13a2 2 0 0 1 2 2V16H9l-5 3.5V8.5a2 2 0 0 1 2-2z" />
    </>
  ),
  reveal: (
    <>
      <path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7z" />
      <circle cx="12" cy="12" r="3" />
    </>
  ),
  next: (
    <>
      <path d="M5 12h14" />
      <path d="M13 6l6 6-6 6" />
    </>
  ),
  check: (
    <>
      <path d="M20 6L9 17l-5-5" />
    </>
  ),
  cafe: (
    <>
      <path d="M6 9h10v5a4 4 0 0 1-4 4h-2a4 4 0 0 1-4-4V9z" />
      <path d="M16 10.5h1.8a2.4 2.4 0 1 1 0 4.8H16" />
      <path d="M8 20h8" />
      <path d="M9 4.2c.5.9.5 1.8 0 2.7" />
      <path d="M12 3.8c.5.9.5 2 0 2.9" />
    </>
  ),
  airport: (
    <>
      <path d="M21 16v-2l-8-5V3.5a1.5 1.5 0 0 0-3 0V9L2 14v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5L21 16z" />
    </>
  ),
  doctor: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 8v8" />
      <path d="M8 12h8" />
    </>
  ),
  hotel: (
    <>
      <path d="M3 18V10a2 2 0 0 1 2-2h7a2 2 0 0 1 2 2v8" />
      <path d="M14 13h5a2 2 0 0 1 2 2v3" />
      <path d="M3 18h18" />
      <path d="M8 8V6" />
    </>
  ),
  pharmacy: (
    <>
      <path d="M8.5 15.5l7-7a3.5 3.5 0 1 1 5 5l-7 7a3.5 3.5 0 1 1-5-5z" />
      <path d="M11.2 12.8l4-4" />
    </>
  ),
  interview: (
    <>
      <rect x="3" y="8" width="18" height="12" rx="2" />
      <path d="M8 8V6a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
      <path d="M3 13h18" />
    </>
  ),
  restaurant: (
    <>
      <path d="M8 3v11" />
      <path d="M6 3v4a2 2 0 0 0 4 0V3" />
      <path d="M8 14v7" />
      <path d="M16 3v18" />
      <path d="M14 8h4" />
    </>
  ),
  taxi: (
    <>
      <path d="M4 16v2a1 1 0 0 0 1 1h1" />
      <path d="M18 19h1a1 1 0 0 0 1-1v-2" />
      <path d="M5 16l1.5-6h11L19 16H5z" />
      <circle cx="7.5" cy="19" r="1.5" />
      <circle cx="16.5" cy="19" r="1.5" />
      <path d="M9 10V7h6v3" />
    </>
  ),
  supermarket: (
    <>
      <path d="M5 7h15l-1.5 8H8L5 7z" />
      <path d="M8 15v2" />
      <path d="M16 15v2" />
      <circle cx="9" cy="20" r="1.2" />
      <circle cx="16" cy="20" r="1.2" />
      <path d="M5 7L4 4H2" />
    </>
  ),
  directions: (
    <>
      <path d="M12 21V8" />
      <path d="M6 8h10l3-3-3-3H6l-2 3 2 3z" />
    </>
  ),
  custom: (
    <>
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z" />
    </>
  ),
  translate: (
    <>
      <path d="M5 8l6 6" />
      <path d="M4 14l6-6 2-3" />
      <path d="M2 5h12" />
      <path d="M7 2h1" />
      <path d="M22 22l-5-10-5 10" />
      <path d="M14 18h6" />
    </>
  ),
  offline: (
    <>
      <path d="M12 4v10" />
      <path d="M8 10l4 4 4-4" />
      <path d="M5 18h14" />
    </>
  ),
  help: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M9.5 9.5a2.6 2.6 0 1 1 3.4 2.45c-.7.32-1.1.86-1.1 1.55" />
      <circle cx="12" cy="17" r="0.85" fill="currentColor" stroke="none" />
    </>
  ),
}

export default function MenuIcon({ name }) {
  return (
    <svg
      className="menu-icon"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {ICONS[name]}
    </svg>
  )
}
