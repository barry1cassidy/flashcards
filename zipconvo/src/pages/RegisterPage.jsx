import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth'
import AuthScreen from './AuthScreen'

export default function RegisterPage() {
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
      title="Continue with email"
      lede="This is the same account as Zipdeck."
      error={error}
      onSubmit={onSubmit}
      action={
        <button className="btn email" type="submit" disabled={busy}>
          {busy ? 'Creating account…' : 'Create account'}
        </button>
      }
      footer={
        <>
          Already have an account? <Link to="/login">Log in</Link>
        </>
      }
    >
      <label className="field">
        <span>Name</span>
        <input value={displayName} onChange={(event) => setDisplayName(event.target.value)} required maxLength={100} />
      </label>
      <label className="field">
        <span>Email</span>
        <input type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
      </label>
      <label className="field">
        <span>Password</span>
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
