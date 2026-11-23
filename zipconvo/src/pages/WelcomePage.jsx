import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth'
import GoogleSignIn from '../GoogleSignIn'

function GoogleMark() {
  return (
    <svg className="google-mark" viewBox="0 0 48 48" aria-hidden="true">
      <path
        fill="#FFC107"
        d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 8 3.1l5.7-5.7C34.2 6.1 29.4 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.7-.4-3.5z"
      />
      <path
        fill="#FF3D00"
        d="M6.3 14.7l6.6 4.8C14.7 16 19 12 24 12c3.1 0 5.8 1.2 8 3.1l5.7-5.7C34.2 6.1 29.4 4 24 4 16.3 4 9.6 8.3 6.3 14.7z"
      />
      <path
        fill="#4CAF50"
        d="M24 44c5.2 0 10-2 13.6-5.2l-6.3-5.3C29.2 35.1 26.7 36 24 36c-5.3 0-9.7-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z"
      />
      <path
        fill="#1976D2"
        d="M43.6 20.5H42V20H24v8h11.3c-1.1 3.2-3.5 5.7-6.6 7l6.3 5.3C37.4 37.4 44 32 44 24c0-1.3-.1-2.7-.4-3.5z"
      />
    </svg>
  )
}

function Person({ tone }) {
  const fill = tone === 'mint' ? '#86D9B8' : '#8AA2FF'
  const facingLeft = tone === 'mint'
  return (
    <svg className="person" viewBox="0 0 66 76" aria-hidden="true">
      <path
        fill={fill}
        d="M21 40C12 46 3 55 2 64c-1 7 6 11 14 11h34c8 0 15-4 14-11-1-9-9-18-18-24-4-4-8-6-12-6s-8 2-12 6z"
      />
      <circle cx="33" cy="22" r="20" fill={fill} />
      <g transform={facingLeft ? 'translate(66 0) scale(-1 1)' : undefined}>
        <circle cx="42" cy="20" r="2.15" fill="#141A2B" />
        <path
          d="M40.5 28.5Q46.5 33 51 27.5"
          fill="none"
          stroke="#141A2B"
          strokeWidth="2.15"
          strokeLinecap="round"
        />
      </g>
    </svg>
  )
}

export default function WelcomePage() {
  const navigate = useNavigate()
  const { user, ready, loginWithGoogle } = useAuth()
  const [error, setError] = useState('')

  if (!ready) {
    return <main className="welcome" />
  }
  if (user && !user.emailVerified) {
    return <Navigate to="/verify" replace />
  }
  if (user) {
    return <Navigate to="/conversations" replace />
  }

  async function onGoogle(idToken) {
    setError('')
    try {
      const signedIn = await loginWithGoogle(idToken)
      navigate(signedIn.emailVerified ? '/conversations' : '/verify', { replace: true })
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <main className="welcome">
      <header className="brand">
        <img src="/mark.svg?v=6" alt="" width="44" height="44" />
        <p className="wordmark">
          <span>Zip</span>CONVO
        </p>
      </header>

      <div className="hello" aria-hidden="true">
        <div className="cast">
          <div className="speaker">
            <p className="bubble blue">¡Hola!</p>
            <Person tone="blue" />
          </div>
          <div className="speaker">
            <p className="bubble mint">Hello!</p>
            <Person tone="mint" />
          </div>
        </div>
        <span className="wave">
          <i /><i /><i /><i /><i /><i /><i /><i /><i /><i />
        </span>
      </div>

      <div className="copy">
        <h1>Learn in conversation.</h1>
        <p>Learn a new language through quick, real conversations.</p>
      </div>

      <div className="actions">
        <GoogleSignIn onCredential={onGoogle}>
          <GoogleMark />
          Continue with Google
        </GoogleSignIn>
        {error ? <p className="error">{error}</p> : null}
        <button className="btn email" type="button" onClick={() => navigate('/register')}>
          Continue with email
        </button>
        <p className="signin">
          Already have an account?{' '}
          <button type="button" onClick={() => navigate('/login')}>
            Log in
          </button>
        </p>
      </div>
    </main>
  )
}
