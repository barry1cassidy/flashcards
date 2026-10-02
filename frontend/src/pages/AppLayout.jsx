import { useEffect, useMemo, useState } from 'react'
import { Outlet, useLocation, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { MenuContext } from '../menu'
import { useAuth } from '../AuthContext'
import { isEmailVerified } from '../email'
import AppHeader from './AppHeader'
import SideMenu from './SideMenu'
import { SPLIT_PANE_QUERY, useMediaQuery } from '../useMediaQuery'

export default function AppLayout() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const location = useLocation()
  const split = useMediaQuery(SPLIT_PANE_QUERY)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    setOpen(false)
  }, [location.pathname, location.search])

  useEffect(() => {
    if (split || !open) {
      return undefined
    }
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    function onKeyDown(event) {
      if (event.key === 'Escape') {
        setOpen(false)
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.body.style.overflow = previous
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open, split])

  const value = useMemo(
    () => ({
      open,
      split,
      toggle: () => setOpen((current) => !current),
      close: () => setOpen(false),
    }),
    [open, split],
  )

  const overlayOpen = open && !split

  return (
    <MenuContext.Provider value={value}>
      <div className={`app-frame ${overlayOpen ? 'menu-open' : ''}`}>
        {overlayOpen ? (
          <button
            className="menu-backdrop"
            type="button"
            aria-label={t('nav.closeMenu')}
            onClick={() => setOpen(false)}
          />
        ) : null}
        <aside id="app-menu" className="app-menu" aria-label={t('nav.menu')}>
          <SideMenu />
        </aside>
        <div className="app-pane">
          <AppHeader />
          {!isEmailVerified(user) && !location.pathname.startsWith('/verify') ? (
            <div className="verify-banner" role="status">
              <p>{t('verify.banner')}</p>
              <Link className="btn primary" to="/verify">
                {t('verify.gateCta')}
              </Link>
            </div>
          ) : null}
          <main className="page-content">
            <Outlet />
          </main>
        </div>
      </div>
    </MenuContext.Provider>
  )
}
