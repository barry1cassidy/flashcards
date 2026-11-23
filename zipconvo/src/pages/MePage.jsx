import { useNavigate } from 'react-router-dom'
import { useAuth } from '../auth'

export default function MePage() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  function signOut() {
    logout()
    navigate('/', { replace: true })
  }

  return (
    <main className="screen">
      <div className="screen-copy">
        <h1>{user?.displayName || 'Me'}</h1>
        <p>{user?.email}</p>
      </div>
      <p className="card-meta">{user?.proLicensed ? 'Zipdeck Pro is on for this account.' : 'This account does not have Zipdeck Pro yet.'}</p>
      {!user?.emailVerified ? <p className="error">Email is not verified yet.</p> : null}
      <div className="practice-bar">
        <button className="btn google" type="button" onClick={signOut}>
          Log out
        </button>
      </div>
    </main>
  )
}
