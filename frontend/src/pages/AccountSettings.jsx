import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { api } from '../api'
import { useAuth } from '../AuthContext'
import { translateError } from '../i18n/errors'
import DeleteAccountSection from './DeleteAccountSection'
import PasswordInput from './PasswordInput'

export default function AccountSettings() {
  const { t } = useTranslation()
  const { user, refresh } = useAuth()
  const hasPassword = user?.hasPassword !== false
  const [feedback, setFeedback] = useState({ section: '', error: '', notice: '' })
  const [name, setName] = useState(user?.displayName || '')
  const [email, setEmail] = useState('')
  const [emailPassword, setEmailPassword] = useState('')
  const [emailCode, setEmailCode] = useState('')
  const [emailPending, setEmailPending] = useState('')
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (window.location.hash !== '#delete-account') {
      return
    }
    document.getElementById('delete-account')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [])

  function showFeedback(section, error, notice = '') {
    setFeedback({ section, error, notice })
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
      showFeedback('password', 'Passwords do not match')
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
    <div className="page">
      <div className="page-title">
        <div>
          <h1>{t('nav.accountSettings')}</h1>
          <p className="muted">{t('settings.accountHint')}</p>
        </div>
      </div>

      <section className="card-form">
        <h2 className="section-heading">{t('settings.displayName')}</h2>
        <CardMessage section="name" feedback={feedback} />
        <form className="stack" onSubmit={saveName}>
          <label>
            {t('settings.fullName')}
            <input value={name} onChange={(event) => setName(event.target.value)} maxLength={100} required />
          </label>
          <button className="btn" type="submit" disabled={busy}>
            {t('settings.saveName')}
          </button>
        </form>
      </section>

      <section className="card-form">
        <h2 className="section-heading">{t('settings.changeEmail')}</h2>
        <CardMessage section="email" feedback={feedback} />
        <p className="muted">{t('settings.currentEmail')}</p>
        <p>{user?.email}</p>
        {hasPassword ? (
          <form className="stack" onSubmit={emailPending ? confirmEmail : requestEmail}>
            <p className="muted">{t('settings.changeEmailHint')}</p>
            <label>
              {t('settings.newEmail')}
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
              <label>
                {t('settings.emailCode')}
                <input
                  value={emailCode}
                  onChange={(event) => setEmailCode(event.target.value)}
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  required
                />
              </label>
            ) : (
              <label>
                {t('settings.currentPassword')}
                <PasswordInput
                  value={emailPassword}
                  onChange={(event) => setEmailPassword(event.target.value)}
                  autoComplete="current-password"
                  required
                />
              </label>
            )}
            <button className="btn" type="submit" disabled={busy}>
              {emailPending ? t('settings.confirmEmail') : t('settings.sendEmailCode')}
            </button>
          </form>
        ) : (
          <p className="muted">{user?.appleSignIn ? t('settings.appleEmail') : t('settings.googleEmail')}</p>
        )}
      </section>

      {hasPassword ? (
        <section className="card-form">
          <h2 className="section-heading">{t('settings.changePassword')}</h2>
          <CardMessage section="password" feedback={feedback} />
          <form className="stack" onSubmit={savePassword}>
            <label>
              {t('settings.currentPassword')}
              <PasswordInput
                value={currentPassword}
                onChange={(event) => setCurrentPassword(event.target.value)}
                autoComplete="current-password"
                required
              />
            </label>
            <label>
              {t('settings.newPassword')}
              <PasswordInput
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                autoComplete="new-password"
                minLength={8}
                required
              />
            </label>
            <label>
              {t('settings.confirmPassword')}
              <PasswordInput
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                autoComplete="new-password"
                minLength={8}
                required
              />
            </label>
            <button className="btn" type="submit" disabled={busy}>
              {t('settings.savePassword')}
            </button>
          </form>
        </section>
      ) : null}

      <DeleteAccountSection />
    </div>
  )
}

function CardMessage({ section, feedback }) {
  const { t } = useTranslation()
  if (feedback.section !== section) {
    return null
  }
  if (feedback.error) {
    return <div className="error">{translateError(t, feedback.error)}</div>
  }
  if (feedback.notice) {
    return <p className="ok">{feedback.notice}</p>
  }
  return null
}

