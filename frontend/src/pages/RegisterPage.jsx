import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../AuthContext'
import { currentLocale } from '../i18n'
import { translateError } from '../i18n/errors'
import { goAfterAuth, inviteAuthState, rememberAuthDestination } from '../authRedirect'
import NativeGuestBar from './NativeGuestBar'
import { isEmailVerified } from '../email'
import MarketingHeader, { MarketingFooter } from './MarketingHeader'
import GoogleSignInButton, { getGoogleClientId } from './GoogleSignInButton'
import AppleSignInButton from './AppleSignInButton'
import { appleSignInAvailable } from '../appleSignIn'
import PasswordInput from './PasswordInput'
import { webMarketing } from '../webOnly'

export default function RegisterPage() {
  const { t } = useTranslation()
  const { register, loginWithGoogle, loginWithApple } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [displayName, setDisplayName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const googleEnabled = Boolean(getGoogleClientId())
  const appleEnabled = appleSignInAvailable()

  async function finishAuth(work) {
    setError('')
    setBusy(true)
    try {
      const created = await work()
      if (created && !isEmailVerified(created)) {
        rememberAuthDestination(location.state?.from)
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

  const card = (
      <section className="register-panel">
        <div className="auth-card">
          {webMarketing ? <p className="kicker">{t('marketing.kicker')}</p> : null}
          <h1>{t('auth.createYourAccount')}</h1>
          <p className="muted">{t('auth.registerSubtitle')}</p>
          {error ? <div className="error">{translateError(t, error)}</div> : null}
          {appleEnabled ? (
            <AppleSignInButton
              disabled={busy}
              onCredential={(result) =>
                finishAuth(() =>
                  loginWithApple(result.identityToken, currentLocale(), result.fullName, result.nonce),
                )
              }
            />
          ) : null}
          {googleEnabled ? (
            <GoogleSignInButton
              disabled={busy}
              onCredential={(idToken) =>
                finishAuth(() => loginWithGoogle(idToken, currentLocale()))
              }
            />
          ) : null}
          {appleEnabled || googleEnabled ? (
            <p className="auth-divider">
              <span>{t('auth.orEmailRegister')}</span>
            </p>
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
              <PasswordInput
                id="register-password"
                name="password"
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
          <p className="auth-switch">
            <span>{t('auth.alreadyHaveAccount')}</span>
            <Link to="/login" state={inviteAuthState(location)}>{t('auth.signIn')}</Link>
          </p>
        </div>
      </section>
  )

  if (!webMarketing) {
    return (
      <div className="app-frame">
        <div className="app-pane">
          <NativeGuestBar />
          <main className="page-content">{card}</main>
        </div>
      </div>
    )
  }

  return (
    <div className="marketing">
      <MarketingHeader />
      {card}
      <MarketingFooter />
    </div>
  )
}
