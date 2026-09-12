import { useEffect, useRef, useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { api } from '../api'
import { useAuth } from '../AuthContext'
import { inviteAuthState, peekJoinInvite, rememberJoinInvite, takeJoinInvite } from '../authRedirect'
import { translateError } from '../i18n/errors'
import MarketingHeader, { MarketingFooter } from './MarketingHeader'

const joiningCodes = new Set()

export default function JoinClassPage() {
  const { t } = useTranslation()
  const { code } = useParams()
  const { user, ready } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [preview, setPreview] = useState(null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [loginOpen, setLoginOpen] = useState(false)
  const joinPath = `/join/${code}`
  const skipAutoJoin = useRef(null)

  useEffect(() => {
    api(`/api/join/${encodeURIComponent(code)}`)
      .then(setPreview)
      .catch((err) => setError(err.message))
  }, [code])

  useEffect(() => {
    if (!ready || user) {
      return
    }
    rememberJoinInvite(joinPath)
  }, [ready, user, joinPath])

  useEffect(() => {
    if (!ready) {
      return
    }
    if (skipAutoJoin.current === null) {
      skipAutoJoin.current = Boolean(user) && peekJoinInvite() !== joinPath
    }
    if (skipAutoJoin.current || !user || !preview || joiningCodes.has(code)) {
      return
    }
    joiningCodes.add(code)
    setError('')
    setBusy(true)
    api(`/api/join/${encodeURIComponent(code)}`, { method: 'POST' })
      .then((detail) => {
        takeJoinInvite()
        navigate(`/classes/${detail.id}`, { replace: true })
      })
      .catch((err) => {
        joiningCodes.delete(code)
        setError(err.message)
        setBusy(false)
      })
  }, [ready, user, preview, code, joinPath, navigate])

  async function join() {
    if (joiningCodes.has(code)) {
      return
    }
    joiningCodes.add(code)
    setError('')
    setBusy(true)
    try {
      const detail = await api(`/api/join/${encodeURIComponent(code)}`, { method: 'POST' })
      takeJoinInvite()
      navigate(`/classes/${detail.id}`, { replace: true })
    } catch (err) {
      joiningCodes.delete(code)
      setError(err.message)
      setBusy(false)
    }
  }

  if (!ready) {
    return <div className="page-loading">{t('app.loading')}</div>
  }

  return (
    <div className="marketing">
      <MarketingHeader showLoginForm loginOpen={loginOpen} onLoginOpenChange={setLoginOpen} />
      <section className="register-panel">
        <div className="auth-card">
          <p className="kicker">{t('classes.joinKicker')}</p>
          {preview ? (
            <>
              <h1>{preview.name}</h1>
              <p className="muted">
                {t('classes.joinPreview', {
                  teacher: preview.teacherName,
                  decks: preview.deckCount,
                  members: preview.memberCount,
                })}
              </p>
              <p className="class-join-code">{preview.joinCode}</p>
            </>
          ) : (
            <h1>{t('classes.joinTitle')}</h1>
          )}
          {error ? <div className="error">{translateError(t, error)}</div> : null}
          {preview && user ? (
            <button className="btn primary" type="button" disabled={busy} onClick={join}>
              {busy ? t('classes.joining') : t('classes.joinButton')}
            </button>
          ) : null}
          {preview && !user ? (
            <div className="header-actions">
              <button
                className="btn primary"
                type="button"
                onPointerDown={(event) => event.stopPropagation()}
                onClick={() => {
                  rememberJoinInvite(joinPath)
                  setLoginOpen(true)
                }}
              >
                {t('auth.signIn')}
              </button>
              <Link
                className="btn"
                to="/register"
                state={inviteAuthState(location)}
                onClick={() => rememberJoinInvite(joinPath)}
              >
                {t('auth.createAccountButton')}
              </Link>
            </div>
          ) : null}
        </div>
      </section>
      <MarketingFooter />
    </div>
  )
}
