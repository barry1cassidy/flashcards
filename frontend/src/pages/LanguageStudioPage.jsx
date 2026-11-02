import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { api } from '../api'
import { useAuth } from '../AuthContext'
import { isProLicensed } from '../pro'
import { useResumeExpiredSubscription } from '../useResumeExpiredSubscription'
import { translateError } from '../i18n/errors'
import {
  STUDIO_LOCATION_ICONS,
  STUDIO_RATE_KINDS,
  STUDIO_SCENARIOS,
  STUDIO_STATUSES,
  conversationIsGraded,
  findStudioPair,
  studioGradeKind,
  studioLibraryPath,
  studioPairKey,
  studioPairLabel,
  studioStatusLabel,
} from '../languageStudio'
import ConfirmModal from './ConfirmModal'
import MenuIcon from './MenuIcon'

const INTRO_POINTS = [
  { icon: 'cafe', title: 'studio.introPoint1Title', body: 'studio.introPoint1Body' },
  { icon: 'reveal', title: 'studio.introPoint2Title', body: 'studio.introPoint2Body' },
  { icon: 'listen', title: 'studio.introPoint3Title', body: 'studio.introPoint3Body' },
]

export default function LanguageStudioPage() {
  const { t } = useTranslation()
  const { user } = useAuth()
  useResumeExpiredSubscription()
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()
  const pro = isProLicensed(user)
  const [pairs, setPairs] = useState([])
  const [items, setItems] = useState([])
  const [playlists, setPlaylists] = useState([])
  const [pendingPlaylistDelete, setPendingPlaylistDelete] = useState(null)
  const [ready, setReady] = useState(!pro)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState('all')
  const [pendingDelete, setPendingDelete] = useState(null)
  const selectedPair = findStudioPair(pairs, params.get('native'), params.get('target'))

  useEffect(() => {
    if (!pro) {
      setReady(true)
      return
    }
    let cancelled = false
    setReady(false)
    api('/api/language-studio/pairs')
      .then((rows) => {
        if (!cancelled) {
          setPairs(rows || [])
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err.message)
          setPairs([])
        }
      })
      .finally(() => {
        if (!cancelled) {
          setReady(true)
        }
      })
    return () => {
      cancelled = true
    }
  }, [pro])

  useEffect(() => {
    if (!pairs.length) {
      return
    }
    if (!selectedPair) {
      const first = pairs[0]
      setParams({ native: first.nativeLanguage, target: first.targetLanguage }, { replace: true })
    }
  }, [pairs, selectedPair, setParams])

  useEffect(() => {
    if (!pro || !selectedPair) {
      setItems([])
      setPlaylists([])
      return
    }
    let cancelled = false
    const query = `nativeLanguage=${encodeURIComponent(selectedPair.nativeLanguage)}&targetLanguage=${encodeURIComponent(selectedPair.targetLanguage)}`
    Promise.all([api(`/api/language-studio/conversations?${query}`), api(`/api/language-studio/playlists?${query}`)])
      .then(([rows, lists]) => {
        if (!cancelled) {
          setItems(rows || [])
          setPlaylists(lists || [])
          setError('')
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err.message)
          setItems([])
          setPlaylists([])
        }
      })
    return () => {
      cancelled = true
    }
  }, [pro, selectedPair])

  const visible = items.filter((item) => {
    if (filter === 'all') {
      return true
    }
    return conversationIsGraded(item) && item.status === filter
  })

  async function remove(item) {
    setError('')
    try {
      await api(`/api/language-studio/conversations/${item.id}`, { method: 'DELETE' })
      const remaining = items.filter((row) => row.id !== item.id)
      setItems(remaining)
      setPendingDelete(null)
      if (remaining.length === 0) {
        const rows = await api('/api/language-studio/pairs')
        setPairs(rows || [])
        setPlaylists([])
      } else if (selectedPair) {
        const lists = await api(
          `/api/language-studio/playlists?nativeLanguage=${encodeURIComponent(selectedPair.nativeLanguage)}&targetLanguage=${encodeURIComponent(selectedPair.targetLanguage)}`,
        )
        setPlaylists(lists || [])
      }
    } catch (err) {
      setError(err.message)
    }
  }

  const showIntro = !pro || (ready && pairs.length === 0)
  const showLibrary = pro && ready && pairs.length > 0
  const newHref = selectedPair
    ? `/language-studio/new?native=${encodeURIComponent(selectedPair.nativeLanguage)}&target=${encodeURIComponent(selectedPair.targetLanguage)}`
    : '/language-studio/new'
  const samplesHref = selectedPair
    ? `/language-studio/samples?native=${encodeURIComponent(selectedPair.nativeLanguage)}&target=${encodeURIComponent(selectedPair.targetLanguage)}`
    : '/language-studio/samples'
  const playlistHref = selectedPair
    ? `/language-studio/playlists/new?native=${encodeURIComponent(selectedPair.nativeLanguage)}&target=${encodeURIComponent(selectedPair.targetLanguage)}`
    : '/language-studio'

  async function removePlaylist(item) {
    setError('')
    try {
      await api(`/api/language-studio/playlists/${item.id}`, { method: 'DELETE' })
      setPlaylists((current) => current.filter((row) => row.id !== item.id))
      setPendingPlaylistDelete(null)
    } catch (err) {
      setError(err.message)
      setPendingPlaylistDelete(null)
    }
  }

  return (
    <div className="page">
      {error ? <div className="error">{translateError(t, error)}</div> : null}
      {pro && !ready ? <p className="muted">{t('app.loading')}</p> : null}

      {showIntro ? <StudioIntro pro={pro} /> : null}

      {showLibrary ? (
        <>
          <div className="page-title">
            <div>
              <h1>{t('studio.title')}</h1>
              <p className="muted">{t('studio.subtitle')}</p>
              <p className="muted studio-schedule">{t('studio.schedule')}</p>
            </div>
            <div className="page-title-actions studio-title-actions">
              <button className="btn primary" type="button" onClick={() => navigate(newHref)}>
                <MenuIcon name="plus" />
                {t('studio.new')}
              </button>
              <button className="btn studio-playlist-new" type="button" onClick={() => navigate(playlistHref)}>
                <MenuIcon name="mix" />
                {t('studio.playlistNew')}
              </button>
              <button className="btn studio-samples-btn" type="button" onClick={() => navigate(samplesHref)}>
                <MenuIcon name="library" />
                {t('studio.samples')}
              </button>
            </div>
          </div>

          {selectedPair ? (
            <div className="studio-library-head">
              {pairs.length > 1 ? (
                <label className="studio-pair-kicker" htmlFor="studio-pair-filter">
                  {t('studio.pairFilter')}
                </label>
              ) : (
                <p className="studio-pair-kicker">{t('studio.pairFilter')}</p>
              )}
              {pairs.length > 1 ? (
                <select
                  id="studio-pair-filter"
                  value={studioPairKey(selectedPair.nativeLanguage, selectedPair.targetLanguage)}
                  onChange={(event) => {
                    const [native, target] = event.target.value.split('::')
                    const next = findStudioPair(pairs, native, target)
                    if (next) {
                      setParams({ native: next.nativeLanguage, target: next.targetLanguage })
                    }
                  }}
                >
                  {pairs.map((pair) => (
                    <option
                      key={pair.id}
                      value={studioPairKey(pair.nativeLanguage, pair.targetLanguage)}
                    >
                      {studioPairLabel(pair, t)}
                    </option>
                  ))}
                </select>
              ) : (
                <h2>{studioPairLabel(selectedPair, t)}</h2>
              )}
            </div>
          ) : null}

          {playlists.length > 0 ? (
            <section className="studio-playlists">
              <h2>{t('studio.playlists')}</h2>
              <div className="studio-list">
                {playlists.map((item) => (
                  <article key={item.id} className="studio-card">
                    <div className="studio-card-copy">
                      <div className="studio-card-title">
                        <h2>{item.name}</h2>
                        <span className="studio-pill">{t('studio.playlistLabel')}</span>
                      </div>
                      <p className="muted">{playlistSummary(t, item)}</p>
                    </div>
                    <div className="deck-card-actions">
                      <button
                        className="btn studio-mode-btn"
                        type="button"
                        onClick={() =>
                          navigate(`/listen?source=studio-playlist&id=${item.id}`, {
                            state: { listenReturn: studioLibraryPath(selectedPair) },
                          })
                        }
                      >
                        <MenuIcon name="listen" />
                        {t('listen.menu')}
                      </button>
                      <button
                        className="btn studio-mode-btn"
                        type="button"
                        onClick={() => navigate(`/language-studio/playlists/${item.id}`)}
                      >
                        {t('common.edit')}
                      </button>
                      <button
                        className="listing-action danger"
                        type="button"
                        aria-label={t('common.deleteNamed', { name: item.name })}
                        onClick={() => setPendingPlaylistDelete(item)}
                      >
                        <MenuIcon name="trash" />
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          ) : null}

          <div className="listen-choice-row studio-filters" role="radiogroup" aria-label={t('studio.filters')}>
            <button
              className={`btn${filter === 'all' ? ' primary' : ''}`}
              type="button"
              aria-pressed={filter === 'all'}
              onClick={() => setFilter('all')}
            >
              {t('studio.filterAll')}
            </button>
            {STUDIO_STATUSES.map((status) => {
              const kind = STUDIO_RATE_KINDS[status]
              return (
                <button
                  key={status}
                  className={`btn rating ${kind}${filter === status ? ' is-on' : ''}`}
                  type="button"
                  aria-pressed={filter === status}
                  onClick={() => setFilter(status)}
                >
                  {studioStatusLabel(status, t)}
                </button>
              )
            })}
          </div>

          {visible.length === 0 ? <p className="muted">{t('studio.filterEmpty')}</p> : null}

          {visible.length > 0 ? (
            <div className="studio-list">
              {visible.map((item) => {
                const graded = conversationIsGraded(item)
                const kind = studioGradeKind(item)
                return (
                  <article key={item.id} className={`studio-card${kind ? ` studio-listed-${kind}` : ''}`}>
                    <div className="studio-card-copy">
                      <div className="studio-card-title">
                        <h2>{item.title}</h2>
                        <span className="studio-pill">{item.level}</span>
                        <span className={`studio-pill studio-grade${kind ? ` ${kind}` : ''}`}>
                          {studioStatusLabel(item.status, t, graded)}
                        </span>
                      </div>
                      <p className="muted">
                        {t(`studio.scenarios.${item.scenario}`, { defaultValue: item.scenario })} ·{' '}
                        {t('studio.turns', { count: item.turnCount })}
                      </p>
                    </div>
                    <div className="deck-card-actions">
                      <button
                        className="btn studio-mode-btn"
                        type="button"
                        onClick={() =>
                          navigate(`/listen?source=studio&id=${item.id}`, {
                            state: { listenReturn: studioLibraryPath(selectedPair) },
                          })
                        }
                      >
                        <MenuIcon name="listen" />
                        {t('listen.menu')}
                      </button>
                      <button
                        className="btn primary studio-mode-btn"
                        type="button"
                        onClick={() => navigate(`/language-studio/${item.id}`)}
                      >
                        <MenuIcon name="practice" />
                        {t('studio.practice')}
                      </button>
                      <button
                        className="listing-action danger"
                        type="button"
                        aria-label={t('common.deleteNamed', { name: item.title })}
                        onClick={() => setPendingDelete(item)}
                      >
                        <MenuIcon name="trash" />
                      </button>
                    </div>
                  </article>
                )
              })}
            </div>
          ) : null}
        </>
      ) : null}

      {pendingPlaylistDelete ? (
        <ConfirmModal
          title={t('studio.playlistDeleteTitle')}
          message={t('studio.playlistDeleteMessage', { name: pendingPlaylistDelete.name })}
          confirmLabel={t('common.delete')}
          danger
          onConfirm={() => removePlaylist(pendingPlaylistDelete)}
          onCancel={() => setPendingPlaylistDelete(null)}
        />
      ) : null}

      {pendingDelete ? (
        <ConfirmModal
          title={t('studio.deleteTitle')}
          message={t('studio.deleteMessage', { name: pendingDelete.title })}
          confirmLabel={t('common.delete')}
          danger
          onConfirm={() => remove(pendingDelete)}
          onCancel={() => setPendingDelete(null)}
        />
      ) : null}
    </div>
  )
}

function playlistSummary(t, playlist) {
  const conversations = t('studio.playlistConversations', { count: playlist.conversationCount || 0 })
  const turns = t('studio.turns', { count: playlist.turnCount || 0 })
  if (playlist.includeAll) {
    return `${t('studio.playlistAll')} · ${conversations} · ${turns}`
  }
  return `${conversations} · ${turns}`
}

function StudioIntro({ pro }) {
  const { t } = useTranslation()

  return (
    <section className="studio-intro">
      <div className="studio-intro-top">
        <div className="studio-intro-copy">
          <h1>{t('studio.introTitle')}</h1>
          <p className="studio-intro-lede">{t('studio.introLede')}</p>
          <p className="studio-intro-why">{t('studio.introWhy')}</p>
          <div className="studio-intro-cta">
            {pro ? (
              <>
                <Link className="btn primary" to="/language-studio/new">
                  {t('studio.new')}
                </Link>
                <Link className="btn" to="/language-studio/samples">
                  {t('studio.samples')}
                </Link>
              </>
            ) : (
              <Link className="btn primary" to="/pro">
                {t('pro.goToPro')}
              </Link>
            )}
          </div>
          <p className="muted">{pro ? t('studio.samplesHint') : t('studio.introProNote')}</p>
          <p className="muted">{t('studio.schedule')}</p>
        </div>

        <figure className="studio-intro-demo" aria-label={t('studio.introDemoCaption')}>
          <div className="studio-intro-demo-head">
            <strong>{t('studio.introDemoEyebrow')}</strong>
            <span className="studio-pill">A2</span>
          </div>
          <div className="studio-chat">
            <div className="studio-bubble is-them">
              <p className="studio-speaker">{t('studio.introDemoThem')}</p>
              <p className="studio-line">{t('studio.introDemoThemLine')}</p>
              <p className="muted">{t('studio.introDemoThemMeaning')}</p>
            </div>
            <div className="studio-bubble is-you">
              <p className="studio-speaker">{t('studio.introDemoYou')}</p>
              <p className="studio-line">{t('studio.introDemoYouLine')}</p>
              <p className="muted">{t('studio.introDemoYouMeaning')}</p>
            </div>
          </div>
          <figcaption>{t('studio.introDemoCaption')}</figcaption>
        </figure>
      </div>

      <div className="studio-intro-points">
        {INTRO_POINTS.map((point) => (
          <article key={point.title} className="studio-intro-point">
            <span className="studio-intro-point-icon" aria-hidden="true">
              <MenuIcon name={point.icon} />
            </span>
            <div>
              <h2>{t(point.title)}</h2>
              <p className="muted">{t(point.body)}</p>
            </div>
          </article>
        ))}
      </div>

      <div className="studio-intro-places-block">
        <h2>{t('studio.introPlacesTitle')}</h2>
        <ul className="studio-intro-places">
          {STUDIO_SCENARIOS.map((item) => (
            <li key={item} className={`studio-location studio-location-${item}`}>
              <span className="studio-location-icon" aria-hidden="true">
                <MenuIcon name={STUDIO_LOCATION_ICONS[item]} />
              </span>
              <span>{t(`studio.scenarios.${item}`)}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
