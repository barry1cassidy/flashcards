import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth'
import AuthScreen from './AuthScreen'

export default function RegisterPage() {
  const { t } = useTranslation()
  const { user, ready, register } = useAuth()
  const navigate = useNavigate()
  const [displayName, setDisplayName] = useState('')
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
      const signedIn = await register(displayName.trim(), email.trim(), password)
      navigate(signedIn.emailVerified ? '/conversations' : '/verify', { replace: true })
    } catch (err) {
      setError(err.message)
      setBusy(false)
    }
  }

  return (
    <AuthScreen
      title={t('register.title')}
      lede={t('register.lede')}
      error={error}
      onSubmit={onSubmit}
      action={
        <button className="btn email" type="submit" disabled={busy}>
          {busy ? t('register.busy') : t('register.create')}
        </button>
      }
      footer={
        <>
          {t('register.haveAccount')} <Link to="/login">{t('welcome.logIn')}</Link>
        </>
      }
    >
      <label className="field">
        <span>{t('name')}</span>
        <input value={displayName} onChange={(event) => setDisplayName(event.target.value)} required maxLength={100} />
      </label>
      <label className="field">
        <span>{t('email')}</span>
        <input type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
      </label>
      <label className="field">
        <span>{t('password')}</span>
        <input
          type="password"
          autoComplete="new-password"
          minLength={8}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
        />
      </label>
    </AuthScreen>
  )
}
