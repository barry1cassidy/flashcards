import { Link, NavLink, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useMenu } from '../menu'
import { useAuth } from '../AuthContext'
import { isAdmin } from '../admin'
import { isProLicensed } from '../pro'
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
  const classesActive = location.pathname.startsWith('/classes')
  const setsActive = location.pathname.startsWith('/sets') || location.pathname.startsWith('/groups')
  const proActive = location.pathname.startsWith('/pro')
  const settingsActive = location.pathname.startsWith('/settings')
  const helpActive = location.pathname.startsWith('/help')
  const admin = isAdmin(user)
  const pro = isProLicensed(user)
  const badge = t('settings.proBadge')

  return (
    <nav className="side-menu">
      <Link to="/" className="side-menu-brand" onClick={close}>
        <Brand />
      </Link>
      <NavLink to="/" end className={() => menuLinkClass(decksActive)} onClick={close}>
        <MenuIcon name="decks" />
        <span className="menu-link-text">{t('decks.title')}</span>
      </NavLink>
      <NavLink to="/sets" className={() => menuLinkClass(setsActive)} onClick={close}>
        <MenuIcon name="groups" />
        <span className="menu-link-text">{t('groups.manage')}</span>
      </NavLink>
      <hr className="side-menu-divider" />
      <NavLink to="/create-with-ai" className={() => menuLinkClass(agentActive)} onClick={close}>
        <MenuIcon name="agent" />
        <span className="menu-link-text">{t('agent.menu')}</span>
        <span className="menu-pro-tag">{badge}</span>
      </NavLink>
      <NavLink to="/mixes" className={() => menuLinkClass(mixActive)} onClick={close}>
        <MenuIcon name="mix" />
        <span className="menu-link-text">{t('mix.menu')}</span>
        <span className="menu-pro-tag">{badge}</span>
      </NavLink>
      <NavLink to="/pro" className={() => menuLinkClass(proActive)} onClick={close}>
        <MenuIcon name="pro" />
        <span className="menu-link-text">{pro ? t('pro.menuAccount') : t('pro.menuUpgrade')}</span>
      </NavLink>
      <hr className="side-menu-divider" />
      <NavLink to="/library" className={() => menuLinkClass(libraryActive)} onClick={close}>
        <MenuIcon name="library" />
        <span className="menu-link-text">{t('library.title')}</span>
      </NavLink>
      {admin ? (
        <NavLink to="/classes" className={() => menuLinkClass(classesActive)} onClick={close}>
          <MenuIcon name="classes" />
          <span className="menu-link-text">{t('classes.title')}</span>
        </NavLink>
      ) : null}
      <hr className="side-menu-divider" />
      <NavLink to="/help" className={() => menuLinkClass(helpActive)} onClick={close}>
        <MenuIcon name="help" />
        <span className="menu-link-text">{t('nav.help')}</span>
      </NavLink>
      <NavLink to="/settings" className={() => menuLinkClass(settingsActive)} onClick={close}>
        <MenuIcon name="settings" />
        <span className="menu-link-text">{t('nav.settings')}</span>
      </NavLink>
    </nav>
  )
}

function menuLinkClass(isActive) {
  return `menu-link ${isActive ? 'active' : ''}`
}
