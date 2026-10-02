import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { api } from '../api'
import { translateError } from '../i18n/errors'
import ConfirmModal from './ConfirmModal'

function sharePath(kind, targetId) {
  return kind === 'SET' ? `/api/groups/${targetId}/share` : `/api/decks/${targetId}/share`
}

function shareUrl(code) {
  return `${window.location.origin}/share/${code}`
}

export default function ShareModal({ kind, targetId, name, onClose }) {
  const { t } = useTranslation()
  const [code, setCode] = useState(null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [copied, setCopied] = useState(false)
  const [revokeOpen, setRevokeOpen] = useState(false)
  const endpoint = sharePath(kind, targetId)

  useEffect(() => {
    api(endpoint)
      .then((link) => setCode(link.code || null))
      .catch((err) => setError(err.message))
  }, [endpoint])

  async function createLink() {
    setError('')
    setBusy(true)
    try {
      const link = await api(endpoint, { method: 'POST' })
      setCode(link.code || null)
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  async function copyLink() {
    if (!code) {
      return
    }
    try {
      await navigator.clipboard.writeText(shareUrl(code))
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    } catch {
      setError(t('share.copyFailed'))
    }
  }

  async function nativeShare() {
    if (!code || typeof navigator.share !== 'function') {
      return copyLink()
    }
    try {
      await navigator.share({
        title: name,
        text: t('share.shareText', { name }),
        url: shareUrl(code),
      })
    } catch (err) {
      if (err && err.name === 'AbortError') {
        return
      }
      await copyLink()
    }
  }

  async function revoke() {
    setRevokeOpen(false)
    setError('')
    setBusy(true)
    try {
      await api(endpoint, { method: 'DELETE' })
      setCode(null)
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  const url = code ? shareUrl(code) : ''

  return (
    <>
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal share-modal" onClick={(event) => event.stopPropagation()} role="dialog" aria-modal="true">
        <div className="modal-header">
          <h2>{t('share.title')}</h2>
          <button className="modal-close" type="button" onClick={onClose} aria-label={t('common.close')}>
            ×
          </button>
        </div>
        <p className="muted">{t('share.hint')}</p>
        {error ? <div className="error">{translateError(t, error)}</div> : null}
        {code ? (
          <>
            <p className="class-join-code">{code}</p>
            <p className="class-join-url muted">{url}</p>
            <div className="header-actions">
              <button className="btn primary" type="button" disabled={busy} onClick={nativeShare}>
                {t('share.shareLink')}
              </button>
              <button className="btn" type="button" disabled={busy} onClick={copyLink}>
                {copied ? t('share.copied') : t('share.copyLink')}
              </button>
              <button className="btn danger" type="button" disabled={busy} onClick={() => setRevokeOpen(true)}>
                {t('share.revoke')}
              </button>
            </div>
          </>
        ) : (
          <div className="header-actions">
            <button className="btn primary" type="button" disabled={busy} onClick={createLink}>
              {busy ? t('share.creating') : t('share.createLink')}
            </button>
            <button className="btn ghost" type="button" onClick={onClose}>
              {t('common.close')}
            </button>
          </div>
        )}
      </div>
    </div>
      {revokeOpen ? (
        <ConfirmModal
          title={t('share.revokeTitle')}
          message={t('share.revokeMessage')}
          confirmLabel={t('share.revoke')}
          danger
          onConfirm={revoke}
          onCancel={() => setRevokeOpen(false)}
        />
      ) : null}
    </>
  )
}
