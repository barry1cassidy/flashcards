import { useEffect, useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../AuthContext'
import { translateError } from '../i18n/errors'
import { currentLocale } from '../i18n'
import GoogleSignInButton, { getGoogleClientId } from './GoogleSignInButton'
import Brand from './Brand'
import { pathAfterAuth } from '../authRedirect'

export default function MarketingHeader({ showLoginForm = false }) {
  const { t } = useTranslation()
  const { user } = useAuth()
  const location = useLocation()
  const [open, setOpen] = useState(false)
  const authRef = useRef(null)
  const onSplash = location.pathname === '/login' || location.pathname === '/'
  const modesHref = onSplash ? '#modes' : '/login#modes'
  const libraryHref = onSplash ? '#library' : '/login#library'
  const whyHref = onSplash ? '#stat' : '/login#stat'

  useEffect(() => {
    function onPointerDown(event) {
      if (authRef.current && !authRef.current.contains(event.target)) {
        setOpen(false)
      }
    }
    function onKeyDown(event) {
      if (event.key === 'Escape') {
        setOpen(false)
      }
    }
    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [])

  return (
    <header className="marketing-header">
      <nav className="marketing-nav">
        <Link to="/" className="marketing-logo">
          <Brand />
        </Link>
        <div className="marketing-links">
          <a href={modesHref}>{t('marketing.studyModes')}</a>
          <a href={libraryHref}>{t('library.title')}</a>
          <a href={whyHref}>{t('marketing.whyItWorks')}</a>
        </div>
        <div className="marketing-auth" ref={authRef}>
          {user ? (
            <Link className="btn login-btn" to="/">
              {t('nav.allDecks')}
            </Link>
          ) : showLoginForm ? (
            <>
              <button
                className="btn login-btn"
                type="button"
                aria-expanded={open}
                aria-controls="login-panel"
                onClick={() => setOpen((value) => !value)}
              >
                {t('auth.signIn')}
              </button>
              {open ? (
                <div id="login-panel" className="login-drop">
                  <LoginFields />
                </div>
              ) : null}
            </>
          ) : (
            <Link className="btn login-btn" to="/login" state={{ from: location }}>
              {t('auth.signIn')}
            </Link>
          )}
        </div>
      </nav>
    </header>
  )
}

function LoginFields() {
  const { t } = useTranslation()
  const { login, loginWithGoogle } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const googleEnabled = Boolean(getGoogleClientId())

  async function finishLogin(work) {
    setError('')
    setBusy(true)
    try {
      await work()
      navigate(pathAfterAuth(location), { replace: true })
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  async function onSubmit(event) {
    event.preventDefault()
    await finishLogin(() => login(email, password))
  }

  return (
    <>
      {error ? <div className="error">{translateError(t, error)}</div> : null}
      {googleEnabled ? (
        <>
          <GoogleSignInButton
            disabled={busy}
            onCredential={(idToken) =>
              finishLogin(() => loginWithGoogle(idToken, currentLocale()))
            }
          />
          <p className="auth-divider">
            <span>{t('auth.orEmail')}</span>
          </p>
        </>
      ) : null}
      <form onSubmit={onSubmit} className="stack">
        <label>
          {t('auth.email')}
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
            autoComplete="email"
            placeholder="you@example.com"
          />
        </label>
        <label>
          {t('auth.password')}
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
            autoComplete="current-password"
            placeholder="••••••••"
          />
        </label>
        <button className="btn primary" type="submit" disabled={busy}>
          {busy ? t('auth.signingIn') : t('auth.continue')}
        </button>
      </form>
      <Link className="login-alt" to="/register" state={location.state}>
        {t('auth.newHere')} {t('auth.createFreeAccount')}
      </Link>
    </>
  )
}

export function MarketingFooter() {
  const { t } = useTranslation()
  return (
    <footer className="site-end">
      <span>{t('marketing.copyright', { year: 2026 })}</span>
      <Link className="site-end-link" to="/privacy">
        {t('privacy.title')}
      </Link>
      <span>{t('marketing.builtFor')}</span>
    </footer>
  )
}
