import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { api } from '../api'
import { useAuth } from '../AuthContext'
import { openBillingPortal } from '../billing'
import { translateError } from '../i18n/errors'
import PasswordInput from './PasswordInput'

function scrollDeletePanel(section, reveal) {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const headerHeight = document.querySelector('.app-header')?.getBoundingClientRect().height ?? 0
  const available = window.innerHeight - headerHeight - 24
  const target = section.getBoundingClientRect().height <= available ? section : reveal
  target.scrollIntoView({
    behavior: reduceMotion ? 'auto' : 'smooth',
    block: 'end',
    inline: 'nearest',
  })
}

export default function DeleteAccountSection() {
  const { t, i18n } = useTranslation()
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const hasPassword = user?.hasPassword !== false
  const [feedback, setFeedback] = useState({ error: '', notice: '' })
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deletion, setDeletion] = useState(null)
  const [deletePassword, setDeletePassword] = useState('')
  const [deleteConfirmation, setDeleteConfirmation] = useState('')
  const [busy, setBusy] = useState(false)
  const sectionRef = useRef(null)
  const revealRef = useRef(null)
  const periodEnd = formatDate(deletion?.currentPeriodEnd, i18n.language)

  useEffect(() => {
    const section = sectionRef.current
    const reveal = revealRef.current
    if (!deletion || !section || !reveal) {
      return undefined
    }
    const frame = window.requestAnimationFrame(() => {
      scrollDeletePanel(section, reveal)
    })
    return () => window.cancelAnimationFrame(frame)
  }, [deletion])

  async function checkDeletion() {
    setFeedback({ error: '', notice: '' })
    setDeletion(null)
    setBusy(true)
    try {
      const status = await api('/api/auth/account/deletion-check', { method: 'POST' })
      setDeletion(status)
    } catch (err) {
      setFeedback({ error: err.message, notice: '' })
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
    setFeedback({ error: '', notice: '' })
    setBusy(true)
    try {
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
    } catch (err) {
      setFeedback({ error: err.message, notice: '' })
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="card-form delete-account-panel" id="delete-account" ref={sectionRef}>
      <h2 className="section-heading">{t('settings.deleteAccount')}</h2>
      {feedback.error ? <div className="error">{translateError(t, feedback.error)}</div> : null}
      {feedback.notice ? <p className="ok">{feedback.notice}</p> : null}
      <div className="stack">
        <p className="muted">{t('settings.deleteAccountHint')}</p>
        {deleteOpen ? null : (
          <button className="btn danger" type="button" disabled={busy} onClick={openDelete}>
            {t('settings.deleteAccount')}
          </button>
        )}
        {deleteOpen && !deletion ? <p className="muted">{t('settings.deleteChecking')}</p> : null}
        {deletion && !deletion.allowed ? (
          <div className="stack delete-account-reveal" ref={revealRef}>
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
          <form className="stack delete-account-reveal" ref={revealRef} onSubmit={removeAccount}>
            {hasPassword ? (
              <p className="muted">{t('settings.deleteConfirmPassword')}</p>
            ) : (
              <div className="delete-confirm-email-block">
                <p className="muted">{t('settings.deleteConfirmEmail')}</p>
                <p className="delete-confirm-email">{user?.email}</p>
              </div>
            )}
            {hasPassword ? (
              <label>
                {t('settings.currentPassword')}
                <PasswordInput
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
  )
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
