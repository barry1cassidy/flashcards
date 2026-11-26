import { useTranslation } from 'react-i18next'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth'
import ProStrip from '../ProStrip'

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
      {user?.proLicensed ? <p className="card-meta">{t('me.proOn')}</p> : <ProStrip />}
      {user?.proLicensed ? (
        <Link className="settings-link" to="/pro">
          {t('me.seePro')}
        </Link>
      ) : null}
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
