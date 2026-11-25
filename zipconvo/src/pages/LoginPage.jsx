import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth'
import AuthScreen from './AuthScreen'

export default function LoginPage() {
  const { t } = useTranslation()
  const { user, ready, login } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  if (!ready) {
    return <main className="welcome" />
  }
  if (user) {
    return <Navigate to={user.emailVerified ? '/conversations' : '/verify'} replace />
  }

  async function onSubmit(event) {
    event.preventDefault()
    setBusy(true)
    setError('')
    try {
      const signedIn = await login(email.trim(), password)
      navigate(signedIn.emailVerified ? '/conversations' : '/verify', { replace: true })
    } catch (err) {
      setError(err.message)
      setBusy(false)
    }
  }

  return (
    <AuthScreen
      title={t('login.title')}
      lede={t('login.lede')}
      error={error}
      onSubmit={onSubmit}
      action={
        <button className="btn email" type="submit" disabled={busy}>
          {busy ? t('login.busy') : t('login.title')}
        </button>
      }
      footer={
        <>
          {t('login.newHere')} <Link to="/register">{t('welcome.email')}</Link>
        </>
      }
    >
      <label className="field">
        <span>{t('email')}</span>
        <input type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
      </label>
      <label className="field">
        <span>{t('password')}</span>
        <input
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
        />
      </label>
    </AuthScreen>
  )
}
