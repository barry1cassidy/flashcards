import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import Brand from './Brand'
import { inviteAuthState } from '../authRedirect'
import { listOfflinePacks } from '../offlinePacks'

export default function NativeGuestBar() {
  const { t } = useTranslation()
  const location = useLocation()
  const onSignIn = location.pathname === '/login'
  const onOffline = location.pathname.startsWith('/offline')
  const [hasOffline, setHasOffline] = useState(false)

  useEffect(() => {
    let cancelled = false
    listOfflinePacks()
      .then((packs) => {
        if (!cancelled) {
          setHasOffline(packs.length > 0)
        }
      })
      .catch(() => {
        if (!cancelled) {
          setHasOffline(false)
        }
      })
    return () => {
      cancelled = true
    }
  }, [location.pathname])

  return (
    <header className="app-header">
      <div className="header-start">
        <Link to="/" className="header-brand">
          <Brand />
        </Link>
      </div>
      {onSignIn ? null : (
        <div className="header-actions">
          {onOffline ? (
            <Link className="btn guest-home-link" to="/">
              {t('offline.home')}
            </Link>
          ) : null}
          {hasOffline && !onOffline ? (
            <Link className="offline-nav-btn" to="/offline">
              {t('offline.landing')}
            </Link>
          ) : null}
          <Link className="btn" to="/login" state={inviteAuthState(location)}>
            {t('auth.signIn')}
          </Link>
        </div>
      )}
    </header>
  )
}
