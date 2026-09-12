import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../AuthContext'
import { isAdmin } from '../admin'
import { isProLicensed } from '../pro'
import { useMenu } from '../menu'
import Brand from './Brand'

export default function AppHeader() {
  const { t } = useTranslation()
  const { open, toggle } = useMenu()

  return (
    <header className="app-header">
      <div className="header-start">
        <button
          className="menu-toggle"
          type="button"
          aria-label={open ? t('nav.closeMenu') : t('nav.openMenu')}
          aria-expanded={open}
          aria-controls="app-menu"
          onClick={toggle}
        >
          <span className="menu-toggle-bars" aria-hidden="true" />
        </button>
        <Link to="/" className="header-brand">
          <Brand />
        </Link>
      </div>
      <div className="header-actions">
        <UserMenu />
      </div>
    </header>
  )
}

function UserMenu() {
  const { t } = useTranslation()
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const menuRef = useRef(null)

  useEffect(() => {
    function onPointerDown(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setOpen(false)
      }
    }
    function onKeyDown(event) {
      if (event.key === 'Escape') {
        setOpen(false)
      }
    }
    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [])

  return (
    <div className="user-menu" ref={menuRef}>
      <button
        className="user-menu-trigger"
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        <span>{user?.displayName}</span>
        {isAdmin(user) && isProLicensed(user) ? (
          <span className="pro-badge" aria-label={t('settings.proBadge')}>
            {t('settings.proBadge')}
          </span>
        ) : null}
        <span className="user-menu-caret" aria-hidden="true">
          ▾
        </span>
      </button>
      {open ? (
        <div className="user-menu-dropdown" role="menu">
          <button
            className="user-menu-item"
            type="button"
            role="menuitem"
            onClick={() => {
              logout()
              navigate('/', { replace: true })
            }}
          >
            {t('nav.logOut')}
          </button>
        </div>
      ) : null}
    </div>
  )
}
