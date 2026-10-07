import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { api } from '../api'
import { useAuth } from '../AuthContext'
import { openBillingPortal } from '../billing'
import { translateError } from '../i18n/errors'

export default function AccountSettings() {
  const { t, i18n } = useTranslation()
  const { user, refresh, logout } = useAuth()
  const navigate = useNavigate()
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
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deletion, setDeletion] = useState(null)
  const [deletePassword, setDeletePassword] = useState('')
  const [deleteConfirmation, setDeleteConfirmation] = useState('')
  const [busy, setBusy] = useState(false)

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

  async function checkDeletion() {
    showFeedback('delete', '')
    setDeletion(null)
    setBusy(true)
    try {
      const status = await api('/api/auth/account/deletion-check', { method: 'POST' })
      setDeletion(status)
    } catch (err) {
      showFeedback('delete', err.message)
    } finally {
      setBusy(false)
    }
  }

  async function openDelete() {
    setDeleteOpen(true)
    await checkDeletion()
  }

  async function removeAccount(event) {
    event.preventDefault()
    await run('delete', async () => {
      try {
        await api('/api/auth/account/delete', {
          method: 'POST',
          body: JSON.stringify(
            hasPassword ? { password: deletePassword } : { confirmation: deleteConfirmation },
          ),
        })
      } catch (err) {
        if (err.message === 'Cancel your subscription before deleting this account') {
          await checkDeletion()
        }
        throw err
      }
      logout()
      navigate('/login', { replace: true })
    })
  }

  const periodEnd = formatDate(deletion?.currentPeriodEnd, i18n.language)

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
            {t('settings.displayName')}
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
                <input
                  type="password"
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
          <p className="muted">{t('settings.googleEmail')}</p>
        )}
      </section>

      {hasPassword ? (
        <section className="card-form">
          <h2 className="section-heading">{t('settings.changePassword')}</h2>
          <CardMessage section="password" feedback={feedback} />
          <form className="stack" onSubmit={savePassword}>
            <label>
              {t('settings.currentPassword')}
              <input
                type="password"
                value={currentPassword}
                onChange={(event) => setCurrentPassword(event.target.value)}
                autoComplete="current-password"
                required
              />
            </label>
            <label>
              {t('settings.newPassword')}
              <input
                type="password"
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                autoComplete="new-password"
                minLength={8}
                required
              />
            </label>
            <label>
              {t('settings.confirmPassword')}
              <input
                type="password"
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

      <section className="card-form">
        <h2 className="section-heading">{t('settings.deleteAccount')}</h2>
        <CardMessage section="delete" feedback={feedback} />
        <div className="stack">
          <p className="muted">{t('settings.deleteAccountHint')}</p>
          {deleteOpen ? null : (
            <button className="btn danger" type="button" disabled={busy} onClick={openDelete}>
              {t('settings.deleteAccount')}
            </button>
          )}
          {deleteOpen && !deletion ? <p className="muted">{t('settings.deleteChecking')}</p> : null}
          {deletion && !deletion.allowed ? (
            <div className="stack">
              <p>
                {deletion.cancelAtPeriodEnd
                  ? periodEnd
                    ? t('settings.deleteBlockedEnding', { date: periodEnd })
                    : t('settings.deleteBlockedEndingSoon')
                  : t('settings.deleteBlocked')}
              </p>
              <ManageSubscription provider={deletion.provider} busy={busy} />
              <button className="btn" type="button" disabled={busy} onClick={checkDeletion}>
                {t('settings.deleteCheckAgain')}
              </button>
            </div>
          ) : null}
          {deletion?.allowed ? (
            <form className="stack" onSubmit={removeAccount}>
              <p className="muted">
                {hasPassword
                  ? t('settings.deleteConfirmPassword')
                  : t('settings.deleteConfirmEmail', { email: user?.email })}
              </p>
              {hasPassword ? (
                <label>
                  {t('settings.currentPassword')}
                  <input
                    type="password"
                    value={deletePassword}
                    onChange={(event) => setDeletePassword(event.target.value)}
                    autoComplete="current-password"
                    required
                  />
                </label>
              ) : (
                <label>
                  {t('auth.email')}
                  <input
                    type="email"
                    value={deleteConfirmation}
                    onChange={(event) => setDeleteConfirmation(event.target.value)}
                    autoComplete="off"
                    required
                  />
                </label>
              )}
              <button className="btn danger" type="submit" disabled={busy}>
                {busy ? t('settings.deleteWorking') : t('settings.deleteConfirm')}
              </button>
            </form>
          ) : null}
        </div>
      </section>
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

function ManageSubscription({ provider, busy }) {
  const { t } = useTranslation()
  if (provider === 'STRIPE') {
    return (
      <button className="btn" type="button" disabled={busy} onClick={() => openBillingPortal()}>
        {t('settings.proManage')}
      </button>
    )
  }
  const href =
    provider === 'GOOGLE'
      ? 'https://play.google.com/store/account/subscriptions'
      : 'https://apps.apple.com/account/subscriptions'
  return (
    <a className="btn" href={href}>
      {t('settings.proManage')}
    </a>
  )
}

function formatDate(value, language) {
  if (!value) {
    return ''
  }
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return ''
  }
  return date.toLocaleDateString(language)
}
