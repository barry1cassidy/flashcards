import { Link, NavLink, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useMenu } from '../menu'
import { useAuth } from '../AuthContext'
import { isAdmin } from '../admin'
import Brand from './Brand'
import MenuIcon from './MenuIcon'

export default function SideMenu() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const location = useLocation()
  const { close } = useMenu()
  const decksActive = location.pathname === '/' || location.pathname.startsWith('/decks')
  const agentActive = location.pathname.startsWith('/create-with-ai')
  const mixActive = location.pathname.startsWith('/mixes')
  const libraryActive = location.pathname.startsWith('/library')
  const setsActive = location.pathname.startsWith('/sets') || location.pathname.startsWith('/groups')
  const settingsActive = location.pathname.startsWith('/settings')
  const admin = isAdmin(user)

  return (
    <nav className="side-menu">
      <Link to="/" className="side-menu-brand" onClick={close}>
        <Brand />
      </Link>
      <NavLink to="/" end className={() => menuLinkClass(decksActive)} onClick={close}>
        <MenuIcon name="decks" />
        <span>{t('decks.title')}</span>
      </NavLink>
      <NavLink to="/sets" className={() => menuLinkClass(setsActive)} onClick={close}>
        <MenuIcon name="groups" />
        <span>{t('groups.manage')}</span>
      </NavLink>
      {admin ? (
        <>
          <hr className="side-menu-divider" />
          <NavLink to="/create-with-ai" className={() => menuLinkClass(agentActive)} onClick={close}>
            <MenuIcon name="agent" />
            <span>{t('agent.menu')}</span>
          </NavLink>
          <NavLink to="/mixes" className={() => menuLinkClass(mixActive)} onClick={close}>
            <MenuIcon name="mix" />
            <span>{t('mix.menu')}</span>
          </NavLink>
        </>
      ) : null}
      <hr className="side-menu-divider" />
      <NavLink to="/library" className={() => menuLinkClass(libraryActive)} onClick={close}>
        <MenuIcon name="library" />
        <span>{t('library.title')}</span>
      </NavLink>
      <div className="side-menu-spacer" />
      <NavLink to="/settings" className={() => menuLinkClass(settingsActive)} onClick={close}>
        <MenuIcon name="settings" />
        <span>{t('nav.settings')}</span>
      </NavLink>
    </nav>
  )
}

function menuLinkClass(isActive) {
  return `menu-link ${isActive ? 'active' : ''}`
}
