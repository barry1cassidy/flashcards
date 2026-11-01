import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { api } from '../api'
import { useAuth } from '../AuthContext'
import { isProLicensed } from '../pro'
import { useResumeExpiredSubscription } from '../useResumeExpiredSubscription'
import { translateError } from '../i18n/errors'
import { studioLibraryPath, studioPairLabel } from '../languageStudio'
import ConfirmModal from './ConfirmModal'

function byCreated(rows) {
  return [...rows].sort((a, b) => String(a.createdAt || '').localeCompare(String(b.createdAt || '')))
}

export default function PlaylistEditorPage() {
  const { t } = useTranslation()
  const { id } = useParams()
  const isNew = !id
  const [params] = useSearchParams()
  const { user } = useAuth()
  useResumeExpiredSubscription()
  const navigate = useNavigate()
  const pro = isProLicensed(user)
  const [name, setName] = useState('')
  const [includeAll, setIncludeAll] = useState(false)
  const [order, setOrder] = useState([])
  const nativeQuery = params.get('native') || ''
  const targetQuery = params.get('target') || ''
  const [pair, setPair] = useState(() =>
    isNew && nativeQuery && targetQuery ? { nativeLanguage: nativeQuery, targetLanguage: targetQuery } : null,
  )
  const [conversations, setConversations] = useState([])
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    if (!pro) {
      setReady(true)
      return undefined
    }
    setReady(false)
    if (isNew && (!nativeQuery || !targetQuery)) {
      setReady(true)
      return undefined
    }
    let cancelled = false
    const load = async () => {
      let nextPair = { nativeLanguage: nativeQuery, targetLanguage: targetQuery }
      let nextOrder = []
      if (!isNew) {
        const playlist = await api(`/api/language-studio/playlists/${id}`)
        if (cancelled) {
          return
        }
        nextPair = { nativeLanguage: playlist.nativeLanguage, targetLanguage: playlist.targetLanguage }
        setName(playlist.name || '')
        setIncludeAll(Boolean(playlist.includeAll))
        nextOrder = (playlist.conversationIds || []).map(String)
      }
      setPair(nextPair)
      const rows = await api(
        `/api/language-studio/conversations?nativeLanguage=${encodeURIComponent(nextPair.nativeLanguage)}&targetLanguage=${encodeURIComponent(nextPair.targetLanguage)}`,
      )
      if (cancelled) {
        return
      }
      const list = rows || []
      const known = new Set(list.map((item) => String(item.id)))
      setConversations(list)
      setOrder(nextOrder.filter((item) => known.has(item)))
      setReady(true)
    }
    load().catch((err) => {
      if (!cancelled) {
        setError(err.message)
        setReady(true)
      }
    })
    return () => {
      cancelled = true
    }
  }, [id, isNew, pro, nativeQuery, targetQuery])

  const libraryPath = studioLibraryPath(pair)
  const byId = new Map(conversations.map((item) => [String(item.id), item]))
  const ordered = order.map((item) => byId.get(item)).filter(Boolean)

  function toggleConversation(conversationId) {
    const key = String(conversationId)
    setOrder((current) => (current.includes(key) ? current.filter((item) => item !== key) : [...current, key]))
  }

  function move(index, delta) {
    setOrder((current) => {
      const target = index + delta
      if (target < 0 || target >= current.length) {
        return current
      }
      const next = current.slice()
      const [row] = next.splice(index, 1)
      next.splice(target, 0, row)
      return next
    })
  }

  function changeIncludeAll(checked) {
    setIncludeAll(checked)
    if (!checked) {
      setOrder((current) => (current.length > 0 ? current : byCreated(conversations).map((item) => String(item.id))))
    }
  }

  async function save(event) {
    event.preventDefault()
    if (!pair) {
      return
    }
    setError('')
    setBusy(true)
    try {
      const body = {
        name,
        nativeLanguage: pair.nativeLanguage,
        targetLanguage: pair.targetLanguage,
        includeAll,
        conversationIds: includeAll ? [] : order,
      }
      if (isNew) {
        await api('/api/language-studio/playlists', { method: 'POST', body: JSON.stringify(body) })
      } else {
        await api(`/api/language-studio/playlists/${id}`, { method: 'PUT', body: JSON.stringify(body) })
      }
      navigate(libraryPath)
    } catch (err) {
      setError(err.message)
      setBusy(false)
    }
  }

  async function remove() {
    setBusy(true)
    try {
      await api(`/api/language-studio/playlists/${id}`, { method: 'DELETE' })
      navigate(libraryPath)
    } catch (err) {
      setError(err.message)
      setBusy(false)
      setConfirmDelete(false)
    }
  }

  if (!pro) {
    return (
      <div className="page">
        <div className="page-title">
          <div>
            <Link className="page-back" to="/language-studio">
              {t('studio.menu')}
            </Link>
            <h1>{t('studio.playlists')}</h1>
          </div>
        </div>
        <section className="card-form">
          <p>{t('studio.proRequired')}</p>
          <Link className="btn primary" to="/pro">
            {t('pro.goToPro')}
          </Link>
        </section>
      </div>
    )
  }

  const canSave = name.trim() && pair && (includeAll || order.length > 0) && conversations.length > 0

  return (
    <div className="page">
      <div className="page-title">
        <div>
          <Link className="page-back" to={libraryPath}>
            {t('studio.menu')}
          </Link>
          <h1>{isNew ? t('studio.playlistNew') : t('studio.playlistEdit')}</h1>
          {pair ? <p className="muted">{studioPairLabel(pair, t)}</p> : null}
          <p className="muted">{t('studio.playlistHint')}</p>
        </div>
      </div>
      {error ? <div className="error">{translateError(t, error)}</div> : null}
      {!ready ? <p className="muted">{t('app.loading')}</p> : null}
      {ready && !pair ? (
        <section className="card-form">
          <p>{t('studio.playlistNeedPair')}</p>
          <Link className="btn primary" to="/language-studio">
            {t('studio.menu')}
          </Link>
        </section>
      ) : null}
      {ready && pair ? (
        <form className="card-form" onSubmit={save}>
          <label>
            {t('studio.playlistName')}
            <input value={name} onChange={(event) => setName(event.target.value)} required maxLength={80} disabled={busy} />
          </label>
          <label className="mix-pick">
            <input
              type="checkbox"
              checked={includeAll}
              onChange={(event) => changeIncludeAll(event.target.checked)}
              disabled={busy || conversations.length === 0}
            />
            <span className="playlist-include">
              <strong>{t('studio.playlistIncludeAll')}</strong>
              <span className="muted">{t('studio.playlistIncludeAllHint')}</span>
            </span>
          </label>

          <div className={`mix-sources${includeAll ? ' is-disabled' : ''}`}>
            <h2>{t('studio.playlistScenes')}</h2>
            {conversations.length === 0 ? <p className="muted">{t('studio.playlistEmptyScenes')}</p> : null}
            {conversations.map((item) => {
              const key = String(item.id)
              return (
                <label key={item.id} className="mix-pick">
                  <input
                    type="checkbox"
                    checked={includeAll || order.includes(key)}
                    onChange={() => toggleConversation(item.id)}
                    disabled={busy || includeAll}
                  />
                  <span>
                    <strong>{item.title}</strong>
                    <span className="muted">
                      {' '}
                      {item.level} · {t('studio.turns', { count: item.turnCount || 0 })}
                    </span>
                  </span>
                </label>
              )
            })}
          </div>

          {!includeAll && ordered.length > 0 ? (
            <div className="playlist-order">
              <h2>{t('studio.playlistOrder')}</h2>
              <p className="muted">{t('studio.playlistOrderHint')}</p>
              {ordered.map((item, index) => (
                <div key={item.id} className="playlist-order-row">
                  <span className="playlist-order-index">{index + 1}</span>
                  <span className="playlist-order-name">{item.title}</span>
                  <div className="playlist-order-actions">
                    <button
                      className="btn"
                      type="button"
                      aria-label={t('studio.playlistEarlier', { name: item.title })}
                      disabled={busy || index === 0}
                      onClick={() => move(index, -1)}
                    >
                      {t('studio.playlistUp')}
                    </button>
                    <button
                      className="btn"
                      type="button"
                      aria-label={t('studio.playlistLater', { name: item.title })}
                      disabled={busy || index === ordered.length - 1}
                      onClick={() => move(index, 1)}
                    >
                      {t('studio.playlistDown')}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : null}

          <div className="header-actions">
            <button className="btn primary" type="submit" disabled={busy || !canSave}>
              {t('common.save')}
            </button>
            <Link className="btn ghost" to={libraryPath}>
              {t('common.cancel')}
            </Link>
            {!isNew ? (
              <button className="btn danger" type="button" disabled={busy} onClick={() => setConfirmDelete(true)}>
                {t('common.delete')}
              </button>
            ) : null}
          </div>
        </form>
      ) : null}
      {confirmDelete ? (
        <ConfirmModal
          title={t('studio.playlistDeleteTitle')}
          message={t('studio.playlistDeleteMessage', { name })}
          confirmLabel={t('common.delete')}
          danger
          onConfirm={remove}
          onCancel={() => setConfirmDelete(false)}
        />
      ) : null}
    </div>
  )
}
