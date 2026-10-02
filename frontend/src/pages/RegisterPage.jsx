import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../AuthContext'
import { currentLocale } from '../i18n'
import { translateError } from '../i18n/errors'
import { goAfterAuth, inviteAuthState } from '../authRedirect'
import { isEmailVerified } from '../email'
import MarketingHeader, { MarketingFooter } from './MarketingHeader'
import GoogleSignInButton, { getGoogleClientId } from './GoogleSignInButton'

export default function RegisterPage() {
  const { t } = useTranslation()
  const { register, loginWithGoogle } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [displayName, setDisplayName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const googleEnabled = Boolean(getGoogleClientId())

  async function finishAuth(work) {
    setError('')
    setBusy(true)
    try {
      const created = await work()
      if (created && !isEmailVerified(created)) {
        navigate('/verify', { replace: true })
        return
      }
      goAfterAuth(navigate, location)
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  async function onSubmit(event) {
    event.preventDefault()
    await finishAuth(() => register(displayName, email, password, currentLocale()))
  }

  return (
    <div className="marketing">
      <MarketingHeader />
      <section className="register-panel">
        <div className="auth-card">
          <p className="kicker">{t('marketing.kicker')}</p>
          <h1>{t('auth.createYourAccount')}</h1>
          <p className="muted">{t('auth.registerSubtitle')}</p>
          {error ? <div className="error">{translateError(t, error)}</div> : null}
          {googleEnabled ? (
            <>
              <GoogleSignInButton
                disabled={busy}
                onCredential={(idToken) =>
                  finishAuth(() => loginWithGoogle(idToken, currentLocale()))
                }
              />
              <p className="auth-divider">
                <span>{t('auth.orEmailRegister')}</span>
              </p>
            </>
          ) : null}
          <form onSubmit={onSubmit} className="stack">
            <label>
              {t('auth.name')}
              <input
                id="register-name"
                name="name"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                required
                autoComplete="name"
              />
            </label>
            <label>
              {t('auth.email')}
              <input
                id="register-username"
                name="username"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="username"
              />
            </label>
            <label>
              {t('auth.password')}
              <input
                id="register-password"
                name="password"
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
