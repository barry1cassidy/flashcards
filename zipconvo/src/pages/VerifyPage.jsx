import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../auth'
import AuthScreen from './AuthScreen'

export default function VerifyPage() {
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
      setNote('A new code is on its way.')
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <AuthScreen
      title="Check your email"
      lede={`Enter the code sent to ${user.email}.`}
      error={error}
      onSubmit={onSubmit}
      action={
        <button className="btn email" type="submit" disabled={busy}>
          {busy ? 'Checking…' : 'Verify'}
        </button>
      }
      footer={
        <>
          <button type="button" onClick={resend}>
            Resend code
          </button>
          {' · '}
          <button type="button" onClick={logout}>
            Log out
          </button>
          {note ? <span className="note">{note}</span> : null}
        </>
      }
    >
      <label className="field">
        <span>Code</span>
        <input inputMode="numeric" autoComplete="one-time-code" value={code} onChange={(event) => setCode(event.target.value)} required />
      </label>
    </AuthScreen>
  )
}
