import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '../api'
import { useAuth } from '../auth'
import { translateError } from '../i18n/errors'
import { StartPro } from '../ProStrip'

export default function MePage() {
  const { t } = useTranslation()
  const { user, logout, refresh } = useAuth()
  const navigate = useNavigate()
  const hasPassword = user?.hasPassword !== false
  const [name, setName] = useState(user?.displayName || '')
  const [email, setEmail] = useState('')
  const [emailPassword, setEmailPassword] = useState('')
  const [emailCode, setEmailCode] = useState('')
  const [emailPending, setEmailPending] = useState('')
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [feedback, setFeedback] = useState({ section: '', error: '', notice: '' })
  const [openSection, setOpenSection] = useState('')

  useEffect(() => {
    setName(user?.displayName || '')
  }, [user?.displayName])

  function signOut() {
    logout()
    navigate('/', { replace: true })
  }

  function showFeedback(section, error, notice = '') {
    setFeedback({ section, error, notice })
  }

  function toggleSection(section) {
    setOpenSection((current) => (current === section ? '' : section))
  }

  async function run(section, work) {
    showFeedback(section, '')
    setBusy(true)
    try {
      const notice = await work()
      showFeedback(section, '', notice || '')
    } catch (err) {
      showFeedback(section, err.message)
    } finally {
      setBusy(false)
    }
  }

  async function saveName(event) {
    event.preventDefault()
    await run('name', async () => {
      await api('/api/auth/me', {
        method: 'PATCH',
        body: JSON.stringify({ displayName: name }),
      })
      await refresh()
      return t('settings.nameSaved')
    })
  }

  async function requestEmail(event) {
    event.preventDefault()
    await run('email', async () => {
      await api('/api/auth/email/request', {
        method: 'POST',
        body: JSON.stringify({ email, currentPassword: emailPassword }),
      })
      setEmailPending(email.trim())
      return t('settings.emailCodeSent', { email: email.trim() })
    })
  }

  async function confirmEmail(event) {
    event.preventDefault()
    await run('email', async () => {
      await api('/api/auth/email/confirm', {
        method: 'POST',
        body: JSON.stringify({ code: emailCode }),
      })
      await refresh()
      setEmail('')
      setEmailPassword('')
      setEmailCode('')
      setEmailPending('')
      return t('settings.emailSaved')
    })
  }

  async function savePassword(event) {
    event.preventDefault()
    if (newPassword !== confirmPassword) {
      showFeedback('password', t('settings.passwordMismatch'))
      return
    }
    await run('password', async () => {
      await api('/api/auth/password', {
        method: 'POST',
        body: JSON.stringify({ currentPassword, newPassword }),
      })
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      return t('settings.passwordSaved')
    })
  }

  return (
    <main className="screen me">
      <div className="screen-copy">
        <h1>{user?.displayName || t('me.fallback')}</h1>
        <p>{user?.email}</p>
      </div>
      {user?.proLicensed ? (
        <>
          <p className="card-meta">{t('me.proOn')}</p>
          <Link className="settings-link" to="/pro">
            {t('me.seePro')}
          </Link>
        </>
      ) : (
        <StartPro compact />
      )}
      {!user?.emailVerified ? <p className="error">{t('me.unverified')}</p> : null}

      <AccountSection
        id="name"
        title={t('settings.displayName')}
        open={openSection === 'name'}
        onToggle={() => toggleSection('name')}
      >
        <AccountMessage section="name" feedback={feedback} />
        <form className="account-form" onSubmit={saveName}>
          <label className="field">
            <span>{t('settings.fullName')}</span>
            <input value={name} onChange={(event) => setName(event.target.value)} maxLength={100} required />
          </label>
          <button className="btn email" type="submit" disabled={busy}>
            {t('settings.saveName')}
          </button>
        </form>
      </AccountSection>

      <AccountSection
        id="email"
        title={t('settings.changeEmail')}
        open={openSection === 'email'}
        onToggle={() => toggleSection('email')}
      >
        <AccountMessage section="email" feedback={feedback} />
        <p className="settings-hint account-current">{t('settings.currentEmail')}</p>
        <p className="account-email">{user?.email}</p>
        {hasPassword ? (
          <form className="account-form" onSubmit={emailPending ? confirmEmail : requestEmail}>
            <p className="settings-hint">{t('settings.changeEmailHint')}</p>
            <label className="field">
              <span>{t('settings.newEmail')}</span>
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                autoComplete="email"
                required
                disabled={Boolean(emailPending)}
              />
            </label>
            {emailPending ? (
              <label className="field">
                <span>{t('settings.emailCode')}</span>
                <input
                  value={emailCode}
                  onChange={(event) => setEmailCode(event.target.value)}
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  required
                />
              </label>
            ) : (
              <label className="field">
                <span>{t('settings.currentPassword')}</span>
                <input
                  type="password"
                  value={emailPassword}
                  onChange={(event) => setEmailPassword(event.target.value)}
                  autoComplete="current-password"
                  required
                />
              </label>
            )}
            <button className="btn email" type="submit" disabled={busy}>
              {emailPending ? t('settings.confirmEmail') : t('settings.sendEmailCode')}
            </button>
          </form>
        ) : (
          <p className="settings-hint">{user?.appleSignIn ? t('settings.appleEmail') : t('settings.googleEmail')}</p>
        )}
      </AccountSection>

      {hasPassword ? (
        <AccountSection
          id="password"
          title={t('settings.changePassword')}
          open={openSection === 'password'}
          onToggle={() => toggleSection('password')}
        >
          <AccountMessage section="password" feedback={feedback} />
          <form className="account-form" onSubmit={savePassword}>
            <label className="field">
              <span>{t('settings.currentPassword')}</span>
              <input
                type="password"
                value={currentPassword}
                onChange={(event) => setCurrentPassword(event.target.value)}
                autoComplete="current-password"
                required
              />
            </label>
            <label className="field">
              <span>{t('settings.newPassword')}</span>
              <input
                type="password"
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                autoComplete="new-password"
                minLength={8}
                required
              />
            </label>
            <label className="field">
              <span>{t('settings.confirmPassword')}</span>
              <input
                type="password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                autoComplete="new-password"
                minLength={8}
                required
              />
            </label>
            <button className="btn email" type="submit" disabled={busy}>
              {t('settings.savePassword')}
            </button>
          </form>
        </AccountSection>
      ) : null}

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

function AccountSection({ id, title, open, onToggle, children }) {
  return (
    <section className={`settings-card${open ? ' is-open' : ''}`}>
      <button className="account-toggle" type="button" aria-expanded={open} aria-controls={`account-${id}`} onClick={onToggle}>
        <span>{title}</span>
        <span className="account-chevron" aria-hidden="true">
          <svg viewBox="0 0 24 24">
            <path d="M6 9l6 6 6-6" />
          </svg>
        </span>
      </button>
      {open ? (
        <div className="settings-pad" id={`account-${id}`}>
          {children}
        </div>
      ) : null}
    </section>
  )
}

function AccountMessage({ section, feedback }) {
  if (feedback.section !== section) {
    return null
  }
  if (feedback.error) {
    return <p className="error">{translateError(feedback.error)}</p>
  }
  if (feedback.notice) {
    return <p className="settings-notice">{feedback.notice}</p>
  }
  return null
}
