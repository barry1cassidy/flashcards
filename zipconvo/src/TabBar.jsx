import { NavLink, useLocation } from 'react-router-dom'

const TABS = [
  { to: '/conversations', label: 'Home', icon: 'home', match: '/conversations' },
  { to: '/scenes', label: 'Scenes', icon: 'scenes', match: '/scenes' },
  { to: '/listen', label: 'Listen', icon: 'listen', match: '/listen' },
  { to: '/me', label: 'Me', icon: 'me', match: '/me' },
]

export default function TabBar() {
  const { pathname } = useLocation()

  return (
    <nav className="tab-bar" aria-label="Main">
      {TABS.map((tab) => {
        const active = pathname === tab.match || pathname.startsWith(`${tab.match}/`)
        return (
          <NavLink key={tab.to} to={tab.to} className={active ? 'is-active' : ''} aria-current={active ? 'page' : undefined}>
            <TabIcon name={tab.icon} active={active} />
            {tab.label}
          </NavLink>
        )
      })}
    </nav>
  )
}

function TabIcon({ name, active }) {
  const common = {
    viewBox: '0 0 24 24',
    'aria-hidden': true,
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.8,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
  }

  if (name === 'home') {
    return (
      <svg {...common}>
        <path d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1z" fill={active ? 'currentColor' : 'none'} />
      </svg>
    )
  }

  if (name === 'scenes') {
    return (
      <svg {...common}>
        <rect x="4" y="5" width="16" height="14" rx="2" />
        <path d="m7 15 3.2-3.2a1 1 0 0 1 1.4 0L15 15" />
        <circle cx="15.5" cy="9" r="1.1" fill="currentColor" stroke="none" />
      </svg>
    )
  }

  if (name === 'listen') {
    return (
      <svg {...common}>
        <path d="M4 13a8 8 0 0 1 16 0" />
        <rect x="3.5" y="13" width="4" height="6.5" rx="1.4" />
        <rect x="16.5" y="13" width="4" height="6.5" rx="1.4" />
      </svg>
    )
  }

  return (
    <svg {...common}>
      <circle cx="12" cy="8" r="3.2" />
      <path d="M5.5 19.5c1.2-3 3.4-4.5 6.5-4.5s5.3 1.5 6.5 4.5" />
    </svg>
  )
}
