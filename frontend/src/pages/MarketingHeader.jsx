import { useEffect, useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../AuthContext'
import { translateError } from '../i18n/errors'
import { currentLocale } from '../i18n'
import { isEmailVerified } from '../email'
import GoogleSignInButton, { getGoogleClientId } from './GoogleSignInButton'
import Brand from './Brand'
import { goAfterAuth, inviteAuthState, clearJoinInvite } from '../authRedirect'
import { SUPPORT_MAILTO } from '../support'
import { listOfflinePacks } from '../offlinePacks'
import { webMarketing } from '../webOnly'
import PasswordInput from './PasswordInput'

export default function MarketingHeader({ showLoginForm = false, loginOpen, onLoginOpenChange }) {
  const { t } = useTranslation()
  const { user } = useAuth()
  const location = useLocation()
  const [internalOpen, setInternalOpen] = useState(() => location.pathname === '/login')
  const [hasOffline, setHasOffline] = useState(false)
  const [navMenu, setNavMenu] = useState(null)
  const controlled = typeof onLoginOpenChange === 'function'
  const open = controlled ? Boolean(loginOpen) : internalOpen
  const setOpen = controlled ? onLoginOpenChange : setInternalOpen
  const authRef = useRef(null)
  const navRef = useRef(null)
  const studyItems = [
    { to: '/#modes', label: t('marketing.studyModes') },
    { to: '/audio-flashcards', label: t('marketing.listenNav') },
    { to: '/memorize', label: t('marketing.rememberNav') },
  ]
  const createItems = webMarketing
    ? [
        { to: '/#ai', label: t('marketing.createCardsNav') },
        { to: '/language-conversations', label: t('marketing.studioMenuNav') },
      ]
    : [
        { to: '/#ai', label: t('marketing.createCardsNav') },
        { to: '/#language-studio', label: t('marketing.studioMenuNav') },
      ]

  function toggleNav(id) {
    setOpen(false)
    setNavMenu((current) => (current === id ? null : id))
  }

  useEffect(() => {
    if (user) {
      setHasOffline(false)
      return undefined
    }
    let cancelled = false
    listOfflinePacks()
      .then((packs) => {
        if (!cancelled) {
          setHasOffline(packs.length > 0)
        }
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [user])

  useEffect(() => {
    function onPointerDown(event) {
      if (navRef.current && !navRef.current.contains(event.target)) {
        setNavMenu(null)
      }
      if (authRef.current && !authRef.current.contains(event.target)) {
        setOpen(false)
      }
    }
    function onKeyDown(event) {
      if (event.key === 'Escape') {
        setOpen(false)
        setNavMenu(null)
      }
    }
    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [setOpen])

  return (
    <header className="marketing-header">
      <nav className="marketing-nav">
        <Link to="/" className="marketing-logo">
          <Brand />
        </Link>
        <div className="marketing-links" ref={navRef}>
          {webMarketing ? (
            <NavMenu
              id="study-menu"
              label={t('marketing.studyNav')}
              open={navMenu === 'study'}
              onToggle={() => toggleNav('study')}
              onNavigate={() => setNavMenu(null)}
              items={studyItems}
            />
          ) : (
            <Link to="/#modes">{t('marketing.studyNav')}</Link>
          )}
          <NavMenu
            id="create-menu"
            label={t('marketing.createNav')}
            open={navMenu === 'create'}
            onToggle={() => toggleNav('create')}
            onNavigate={() => setNavMenu(null)}
            items={createItems}
          />
          {webMarketing ? <Link to="/library">{t('library.title')}</Link> : null}
          <Link to={webMarketing ? '/teachers' : '/#teachers'}>{t('marketing.teachersNav')}</Link>
        </div>
        <div className="marketing-auth" ref={authRef}>
          {!user && hasOffline ? (
            <Link className="offline-nav-btn" to="/offline">
              {t('offline.landing')}
            </Link>
          ) : null}
          {user ? (
            <Link className="btn login-btn" to="/" onClick={clearJoinInvite}>
              {t('nav.allDecks')}
            </Link>
          ) : showLoginForm ? (
            <>
              <button
                className="btn login-btn"
                type="button"
                aria-expanded={open}
                aria-controls="login-panel"
                onClick={() => {
                  setNavMenu(null)
                  setOpen((value) => !value)
                }}
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
            <Link className="btn login-btn" to="/login" state={inviteAuthState(location)}>
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
      const signedIn = await work()
      if (signedIn && !isEmailVerified(signedIn)) {
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
            id="login-username"
            name="username"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
            autoComplete="username"
            placeholder="you@example.com"
          />
        </label>
        <label>
          {t('auth.password')}
          <PasswordInput
            id="login-password"
            name="password"
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
      <Link className="login-alt" to="/forgot-password">
        {t('auth.forgotPassword')}
      </Link>
      <Link className="login-alt" to="/register" state={inviteAuthState(location)}>
        {t('auth.newHere')} {t('auth.createFreeAccount')}
      </Link>
    </>
  )
}

function NavMenu({ id, label, open, onToggle, onNavigate, items }) {
  return (
    <div className={`marketing-menu${open ? ' is-open' : ''}`}>
      <button
        className="marketing-menu-trigger"
        type="button"
        aria-expanded={open}
        aria-haspopup="menu"
        aria-controls={id}
        onClick={onToggle}
      >
        <span>{label}</span>
        <span className="marketing-menu-caret" aria-hidden="true" />
      </button>
      {open ? (
        <div id={id} className="marketing-menu-panel" role="menu">
          {items.map((item) => (
            <Link key={item.to} to={item.to} role="menuitem" onClick={onNavigate}>
              {item.label}
            </Link>
          ))}
        </div>
      ) : null}
    </div>
  )
}

export function MarketingFooter() {
  const { t } = useTranslation()
  return (
    <footer className="site-end">
      <div className="site-end-links">
        <Link className="site-end-link" to="/help">
          {t('nav.help')}
        </Link>
        <a className="site-end-link" href={SUPPORT_MAILTO}>
          {t('nav.support')}
        </a>
        {webMarketing ? (
          <Link className="site-end-link" to="/teachers">
            {t('marketing.teachersFooter')}
          </Link>
        ) : null}
        {webMarketing ? (
          <Link className="site-end-link" to="/quizlet-alternative">
            {t('marketing.quizletHomeTitle')}
          </Link>
        ) : null}
        {webMarketing ? (
          <Link className="site-end-link" to="/language-conversations">
            {t('marketing.studioNav')}
          </Link>
        ) : null}
        <Link className="site-end-link" to="/privacy">
          {t('privacy.title')}
        </Link>
      </div>
      <span>{t('marketing.copyright', { year: 2026 })}</span>
    </footer>
  )
}
