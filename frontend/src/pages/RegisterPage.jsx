import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../AuthContext'
import { translateError } from '../i18n/errors'
import MarketingHeader, { MarketingFooter } from './MarketingHeader'

export default function RegisterPage() {
  const { t, i18n } = useTranslation()
  const { register } = useAuth()
  const navigate = useNavigate()
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
      await register(displayName, email, password, i18n.resolvedLanguage === 'es' ? 'es' : 'en')
      navigate('/', { replace: true })
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
            {t('auth.alreadyHaveAccount')} <Link to="/login">{t('auth.signIn')}</Link>
          </p>
        </div>
      </section>
      <MarketingFooter />
    </div>
  )
}
