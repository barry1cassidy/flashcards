import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../auth'
import AuthScreen from './AuthScreen'

export default function VerifyPage() {
  const { t } = useTranslation()
  const { user, ready, verifyEmail, resendVerification, logout } = useAuth()
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState(false)

  if (!ready) {
    return <main className="welcome" />
  }
  if (!user) {
    return <Navigate to="/" replace />
  }
  if (user.emailVerified) {
    return <Navigate to="/conversations" replace />
  }

  async function onSubmit(event) {
    event.preventDefault()
    setBusy(true)
    setError('')
    try {
      await verifyEmail(code.trim())
    } catch (err) {
      setError(err.message)
      setBusy(false)
    }
  }

  async function resend() {
    setError('')
    setNote('')
    try {
      await resendVerification()
      setNote(t('verify.sent'))
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <AuthScreen
      title={t('verify.title')}
      lede={t('verify.lede', { email: user.email })}
      error={error}
      onSubmit={onSubmit}
      action={
        <button className="btn email" type="submit" disabled={busy}>
          {busy ? t('verify.busy') : t('verify.verify')}
        </button>
      }
      footer={
        <>
          <button type="button" onClick={resend}>
            {t('verify.resend')}
          </button>
          {' · '}
          <button type="button" onClick={logout}>
            {t('logOut')}
          </button>
          {note ? <span className="note">{note}</span> : null}
        </>
      }
    >
      <label className="field">
        <span>{t('code')}</span>
        <input inputMode="numeric" autoComplete="one-time-code" value={code} onChange={(event) => setCode(event.target.value)} required />
      </label>
    </AuthScreen>
  )
}
