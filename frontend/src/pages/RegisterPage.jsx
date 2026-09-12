import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../AuthContext'
import { currentLocale } from '../i18n'
import { translateError } from '../i18n/errors'
import { goAfterAuth, inviteAuthState } from '../authRedirect'
import MarketingHeader, { MarketingFooter } from './MarketingHeader'

export default function RegisterPage() {
  const { t } = useTranslation()
  const { register } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [displayName, setDisplayName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function onSubmit(event) {
    event.preventDefault()
    setError('')
    setBusy(true)
    try {
      await register(displayName, email, password, currentLocale())
      goAfterAuth(navigate, location)
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="marketing">
      <MarketingHeader />
      <section className="register-panel">
        <div className="auth-card">
          <p className="kicker">{t('marketing.kicker')}</p>
          <h1>{t('auth.createYourAccount')}</h1>
          <p className="muted">{t('auth.registerSubtitle')}</p>
          <form onSubmit={onSubmit} className="stack">
            {error ? <div className="error">{translateError(t, error)}</div> : null}
            <label>
              {t('auth.name')}
              <input value={displayName} onChange={(e) => setDisplayName(e.target.value)} required autoComplete="name" />
            </label>
            <label>
              {t('auth.email')}
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
            </label>
            <label>
              {t('auth.password')}
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                autoComplete="new-password"
              />
            </label>
            <button className="btn primary" type="submit" disabled={busy}>
              {busy ? t('auth.creating') : t('auth.createAccountButton')}
            </button>
          </form>
          <p className="muted">
            {t('auth.alreadyHaveAccount')} <Link to="/login" state={inviteAuthState(location)}>{t('auth.signIn')}</Link>
          </p>
        </div>
      </section>
      <MarketingFooter />
    </div>
  )
}
