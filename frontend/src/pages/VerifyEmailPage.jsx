import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../AuthContext'
import { isEmailVerified } from '../email'
import { translateError } from '../i18n/errors'

export default function VerifyEmailPage() {
  const { t } = useTranslation()
  const { user, verifyEmail, resendVerification } = useAuth()
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [busy, setBusy] = useState(false)

  if (!user) {
    return <Navigate to="/login" replace />
  }
  if (isEmailVerified(user)) {
    return <Navigate to="/" replace />
  }

  async function onSubmit(event) {
    event.preventDefault()
    setError('')
    setNotice('')
    setBusy(true)
    try {
      await verifyEmail(code)
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  async function onResend() {
    setError('')
    setNotice('')
    setBusy(true)
    try {
      await resendVerification()
      setNotice(t('verify.resent'))
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="page">
      <div className="page-title">
        <div>
          <h1>{t('verify.title')}</h1>
          <p className="muted">{t('verify.subtitle', { email: user.email })}</p>
        </div>
      </div>
      <section className="card-form">
        {error ? (
          <div className="error" role="alert">
            {translateError(t, error)}
          </div>
        ) : null}
        {notice ? (
          <p className="ok" role="status">
            {notice}
          </p>
        ) : null}
        <form onSubmit={onSubmit} className="stack">
          <label>
            {t('verify.codeLabel')}
            <input
              id="verify-code"
              name="one-time-code"
              inputMode="numeric"
              autoComplete="one-time-code"
              pattern="\d{6}"
              maxLength={6}
              value={code}
              onChange={(event) => setCode(event.target.value.replace(/\D/g, '').slice(0, 6))}
              required
            />
          </label>
          <button className="btn primary" type="submit" disabled={busy || code.length !== 6}>
            {busy ? t('verify.checking') : t('verify.submit')}
          </button>
        </form>
        <button className="btn" type="button" disabled={busy} onClick={onResend}>
          {t('verify.resend')}
        </button>
        <p className="muted">{t('verify.allowedHint')}</p>
      </section>
    </div>
  )
}
