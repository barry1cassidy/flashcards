import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { api } from '../api'
import { translateError } from '../i18n/errors'
import MarketingHeader, { MarketingFooter } from './MarketingHeader'

export default function ForgotPasswordPage() {
  const { t } = useTranslation()
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [password, setPassword] = useState('')
  const [sent, setSent] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function sendCode(event) {
    event.preventDefault()
    setError('')
    setBusy(true)
    try {
      await api('/api/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email }),
      })
      setSent(true)
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  async function reset(event) {
    event.preventDefault()
    setError('')
    setBusy(true)
    try {
      await api('/api/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({ email, code, password }),
      })
      setDone(true)
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="marketing">
      <MarketingHeader />
      <section className="register-panel">
        <div className="auth-card">
          <h1>{t('auth.forgotTitle')}</h1>
          <p className="muted">{t('auth.forgotSubtitle')}</p>
          {error ? <div className="error">{translateError(t, error)}</div> : null}
          {done ? (
            <p className="ok">{t('auth.resetDone')}</p>
          ) : sent ? (
            <form className="stack" onSubmit={reset}>
              <p className="ok">{t('auth.forgotSent')}</p>
              <label>
                {t('auth.resetCode')}
                <input
                  value={code}
                  onChange={(event) => setCode(event.target.value)}
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  required
                />
              </label>
              <label>
                {t('auth.resetPassword')}
                <input
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  autoComplete="new-password"
                  minLength={8}
                  required
                />
              </label>
              <button className="btn primary" type="submit" disabled={busy}>
                {busy ? t('auth.resetSaving') : t('auth.resetSubmit')}
              </button>
            </form>
          ) : (
            <form className="stack" onSubmit={sendCode}>
              <label>
                {t('auth.email')}
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  autoComplete="username"
                  required
                />
              </label>
              <button className="btn primary" type="submit" disabled={busy}>
                {busy ? t('auth.forgotSending') : t('auth.forgotSend')}
              </button>
            </form>
          )}
          <Link className="login-alt" to="/login">
            {t('auth.backToLogin')}
          </Link>
        </div>
      </section>
      <MarketingFooter />
    </div>
  )
}
