import { useTranslation } from 'react-i18next'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth'

export default function MePage() {
  const { t } = useTranslation()
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  function signOut() {
    logout()
    navigate('/', { replace: true })
  }

  return (
    <main className="screen">
      <div className="screen-copy">
        <h1>{user?.displayName || t('me.fallback')}</h1>
        <p>{user?.email}</p>
      </div>
      <p className="card-meta">{user?.proLicensed ? t('me.proOn') : t('me.proOff')}</p>
      {!user?.emailVerified ? <p className="error">{t('me.unverified')}</p> : null}
      <div className="practice-bar">
        <Link className="settings-link" to="/me/settings">
          {t('me.settings')}
        </Link>
        <button className="btn google" type="button" onClick={signOut}>
          {t('logOut')}
        </button>
      </div>
    </main>
  )
}
