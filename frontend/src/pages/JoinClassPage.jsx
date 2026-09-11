import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { api } from '../api'
import { useAuth } from '../AuthContext'
import { translateError } from '../i18n/errors'
import MarketingHeader, { MarketingFooter } from './MarketingHeader'

export default function JoinClassPage() {
  const { t } = useTranslation()
  const { code } = useParams()
  const { user, ready } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [preview, setPreview] = useState(null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    api(`/api/join/${encodeURIComponent(code)}`)
      .then(setPreview)
      .catch((err) => setError(err.message))
  }, [code])

  async function join() {
    setError('')
    setBusy(true)
    try {
      const detail = await api(`/api/join/${encodeURIComponent(code)}`, { method: 'POST' })
      navigate(`/classes/${detail.id}`, { replace: true })
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  if (!ready) {
    return <div className="page-loading">{t('app.loading')}</div>
  }

  return (
    <div className="marketing">
      <MarketingHeader />
      <section className="register-panel">
        <div className="auth-card">
          <p className="kicker">{t('classes.joinKicker')}</p>
          {preview ? (
            <>
              <h1>{preview.name}</h1>
              <p className="muted">
                {t('classes.joinPreview', {
                  teacher: preview.teacherName,
                  decks: preview.deckCount,
                  members: preview.memberCount,
                })}
              </p>
              <p className="class-join-code">{preview.joinCode}</p>
            </>
          ) : (
            <h1>{t('classes.joinTitle')}</h1>
          )}
          {error ? <div className="error">{translateError(t, error)}</div> : null}
          {preview && user ? (
            <button className="btn primary" type="button" disabled={busy} onClick={join}>
              {busy ? t('classes.joining') : t('classes.joinButton')}
            </button>
          ) : null}
          {preview && !user ? (
            <div className="header-actions">
              <Link className="btn primary" to="/login" state={{ from: location }}>
                {t('auth.signIn')}
              </Link>
              <Link className="btn" to="/register" state={{ from: location }}>
                {t('auth.createAccountButton')}
              </Link>
            </div>
          ) : null}
        </div>
      </section>
      <MarketingFooter />
    </div>
  )
}
