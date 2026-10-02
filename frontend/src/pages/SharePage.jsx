import { useEffect, useRef, useState } from 'react'
import { Link, Navigate, useLocation, useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { api } from '../api'
import { useAuth } from '../AuthContext'
import { isEmailVerified } from '../email'
import { inviteAuthState, peekJoinInvite, rememberJoinInvite, takeJoinInvite } from '../authRedirect'
import { translateError } from '../i18n/errors'
import MarketingHeader, { MarketingFooter } from './MarketingHeader'

const copyingCodes = new Set()

function destination(result) {
  if (result?.kind === 'SET' && result.groupId) {
    return `/sets/${result.groupId}`
  }
  if (result?.deckId) {
    return `/decks/${result.deckId}`
  }
  return '/'
}

export default function SharePage() {
  const { t } = useTranslation()
  const { code } = useParams()
  const { user, ready } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [preview, setPreview] = useState(null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [loginOpen, setLoginOpen] = useState(false)
  const sharePath = `/share/${code}`
  const skipAutoCopy = useRef(null)

  useEffect(() => {
    api(`/api/shares/${encodeURIComponent(code)}`)
      .then(setPreview)
      .catch((err) => setError(err.message))
  }, [code])

  useEffect(() => {
    if (!ready) {
      return
    }
    if (!user || !isEmailVerified(user)) {
      rememberJoinInvite(sharePath)
    }
  }, [ready, user, sharePath])

  useEffect(() => {
    if (!ready) {
      return
    }
    if (skipAutoCopy.current === null) {
      skipAutoCopy.current = Boolean(user) && peekJoinInvite() !== sharePath
    }
    if (skipAutoCopy.current || !user || !isEmailVerified(user) || !preview || copyingCodes.has(code)) {
      return
    }
    copyingCodes.add(code)
    setError('')
    setBusy(true)
    api(`/api/shares/${encodeURIComponent(code)}/copy`, { method: 'POST' })
      .then((result) => {
        takeJoinInvite()
        navigate(destination(result), { replace: true })
      })
      .catch((err) => {
        copyingCodes.delete(code)
        setError(err.message)
        setBusy(false)
      })
  }, [ready, user, preview, code, sharePath, navigate])

  async function copyShare() {
    if (copyingCodes.has(code)) {
      return
    }
    copyingCodes.add(code)
    setError('')
    setBusy(true)
    try {
      const result = await api(`/api/shares/${encodeURIComponent(code)}/copy`, { method: 'POST' })
      takeJoinInvite()
      navigate(destination(result), { replace: true })
    } catch (err) {
      copyingCodes.delete(code)
      setError(err.message)
      setBusy(false)
    }
  }

  if (!ready) {
    return <div className="page-loading">{t('app.loading')}</div>
  }

  if (user && !isEmailVerified(user)) {
    return <Navigate to="/verify" replace />
  }

  const isSet = preview?.kind === 'SET'
  const alreadyHere = preview?.ownShare || preview?.existingDeckId || preview?.existingGroupId
  const actionLabel = preview?.ownShare
    ? t('share.openOriginal')
    : alreadyHere
      ? t('share.openCopy')
      : busy
        ? t('share.copying')
        : t('share.copyButton')

  return (
    <div className="marketing">
      <MarketingHeader showLoginForm loginOpen={loginOpen} onLoginOpenChange={setLoginOpen} />
      <section className="register-panel">
        <div className="auth-card">
          {preview ? <p className="kicker">{isSet ? t('share.setKicker') : t('share.deckKicker')}</p> : null}
          {preview ? (
            <>
              <h1>{preview.name}</h1>
              <p className="muted">
                {isSet
                  ? t('share.setPreview', {
                      owner: preview.ownerName,
                      decks: t('groups.decks', { count: preview.deckCount }),
                      cards: t('decks.cards', { count: preview.cardCount }),
                    })
                  : t('share.deckPreview', {
                      owner: preview.ownerName,
                      cards: t('decks.cards', { count: preview.cardCount }),
                    })}
              </p>
              <p className="class-join-code">{preview.code}</p>
              <p className="muted">{preview.ownShare ? t('share.ownHint') : t('share.copyHint')}</p>
            </>
          ) : (
            <h1>{t('share.pageTitle')}</h1>
          )}
          {error ? <div className="error">{translateError(t, error)}</div> : null}
          {preview && user ? (
            <button className="btn primary" type="button" disabled={busy} onClick={copyShare}>
              {actionLabel}
            </button>
          ) : null}
          {preview && !user ? (
            <div className="header-actions">
              <button
                className="btn primary"
                type="button"
                onPointerDown={(event) => event.stopPropagation()}
                onClick={() => {
                  rememberJoinInvite(sharePath)
                  setLoginOpen(true)
                }}
              >
                {t('auth.signIn')}
              </button>
              <Link
                className="btn"
                to="/register"
                state={inviteAuthState(location)}
                onClick={() => rememberJoinInvite(sharePath)}
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
