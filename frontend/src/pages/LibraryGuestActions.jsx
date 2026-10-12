import { Link, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { rememberLibraryReturn } from '../authRedirect'

export default function LibraryGuestActions({ returnPath, signIn = true, label }) {
  const { t } = useTranslation()
  const location = useLocation()
  const from = returnPath || `${location.pathname}${location.search}`

  function keepReturn() {
    rememberLibraryReturn(from)
  }

  return (
    <div className="library-guest-actions">
      <Link className="btn primary" to="/register" state={{ from }} onClick={keepReturn}>
        {label || t('library.signUpToStudy')}
      </Link>
      {signIn ? (
        <Link className="btn" to="/login" state={{ from }} onClick={keepReturn}>
          {t('auth.signIn')}
        </Link>
      ) : null}
    </div>
  )
}
