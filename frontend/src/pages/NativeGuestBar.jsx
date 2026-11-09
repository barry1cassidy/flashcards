import { Link, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import Brand from './Brand'
import { inviteAuthState } from '../authRedirect'

export default function NativeGuestBar() {
  const { t } = useTranslation()
  const location = useLocation()
  const onSignIn = location.pathname === '/login'

  return (
    <header className="app-header">
      <div className="header-start">
        <Link to="/" className="header-brand">
          <Brand />
        </Link>
      </div>
      {onSignIn ? null : (
        <div className="header-actions">
          <Link className="btn" to="/login" state={inviteAuthState(location)}>
            {t('auth.signIn')}
          </Link>
        </div>
      )}
    </header>
  )
}
