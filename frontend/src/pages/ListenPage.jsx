import { useEffect, useRef, useState } from 'react'
import { Capacitor } from '@capacitor/core'
import { Link, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { api } from '../api'
import { useAuth } from '../AuthContext'
import { isProLicensed } from '../pro'
import { translateError } from '../i18n/errors'
import { listOfflinePacks } from '../offlinePacks'
import { flattenListenCards, loadListenQueue } from '../listenQueue'
import { createListenSession } from '../listenSession'
import { startListenPlayback, stopListenPlayback } from '../listenPlayback'
import ListenPlayer from './ListenPlayer'
import { UseScene } from './ListenScenes'
import MenuIcon from './MenuIcon'

const GATE_SCENES = [
  { scene: 'walk', label: 'listen.useWalk' },
  { scene: 'run', label: 'listen.useRun' },
  { scene: 'workout', label: 'listen.useWorkout' },
  { scene: 'chores', label: 'listen.useChores' },
]

const WAITS = [
  { id: 'short', ms: 2000 },
  { id: 'medium', ms: 4000 },
  { id: 'long', ms: 7000 },
]
const SOURCES = [
  { id: 'deck', icon: 'decks' },
  { id: 'set', icon: 'groups' },
  { id: 'mix', icon: 'mix' },
  { id: 'offline', icon: 'offline' },
]
const PAGE_SIZE = 8

function itemColor(item) {
  const raw = item.color || item.group?.color
  return typeof raw === 'string' && /^#[0-9A-Fa-f]{6}$/.test(raw.trim()) ? raw.trim() : ''
}

export default function ListenPage() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const pro = isProLicensed(user)
  const [params, setParams] = useSearchParams()
  const sourceParam = params.get('source')
  const source = SOURCES.some((item) => item.id === sourceParam) ? sourceParam : ''
  const id = params.get('id') || ''
  const [items, setItems] = useState(null)
  const [selectedOffline, setSelectedOffline] = useState(null)
  const [wait, setWait] = useState('medium')
  const [side, setSide] = useState('front')
  const [loop, setLoop] = useState(false)
  const [announce, setAnnounce] = useState(true)
  const [queue, setQueue] = useState(null)
  const [queueError, setQueueError] = useState('')
  const [loadingQueue, setLoadingQueue] = useState(false)
  const [playing, setPlaying] = useState(false)
  const [playback, setPlayback] = useState(null)
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(1)
  const sessionRef = useRef(null)

  const offlineIds = source === 'offline' ? [...(selectedOffline || [])] : []
  const multi = (queue?.decks.length || 0) > 1
  const cards = queue ? flattenListenCards(queue.decks) : []
  const ready = Boolean(queue) && !loadingQueue && !queueError && cards.length > 0

  useEffect(() => {
    sessionRef.current?.stop()
    sessionRef.current = null
    setPlaying(false)
    setPlayback(null)
  }, [source, id, selectedOffline])

  useEffect(() => {
    if (!pro || !source || source === 'offline' || id) {
      return undefined
    }
    let cancelled = false
    setItems(null)
    const path = source === 'deck' ? '/api/decks' : source === 'set' ? '/api/groups' : '/api/mixes'
    api(path)
      .then((found) => {
        if (!cancelled) {
          setItems(found || [])
        }
      })
      .catch((error) => {
        if (!cancelled) {
          setQueueError(error.message)
          setItems([])
        }
      })
    return () => {
      cancelled = true
    }
  }, [pro, source, id])

  useEffect(() => {
    if (!pro || source !== 'offline') {
      return undefined
    }
    let cancelled = false
    listOfflinePacks()
      .then((packs) => {
        if (cancelled) {
          return
        }
        setItems(packs)
        setSelectedOffline((current) => current || new Set(packs.map((pack) => pack.id)))
      })
      .catch(() => {
        if (!cancelled) {
          setItems([])
          setSelectedOffline(new Set())
        }
      })
    return () => {
      cancelled = true
    }
  }, [pro, source])

  useEffect(() => {
    if (!pro) {
      return undefined
    }
    const canLoad =
      (source === 'deck' && id) ||
      (source === 'set' && id) ||
      (source === 'mix' && id) ||
      (source === 'offline' && offlineIds.length > 0)
    if (!canLoad) {
      setQueue(null)
      setLoadingQueue(false)
      return undefined
    }
    let cancelled = false
    setLoadingQueue(true)
    setQueueError('')
    loadListenQueue({ source, id, ids: offlineIds })
      .then((loaded) => {
        if (!cancelled) {
          setQueue(loaded)
          setLoadingQueue(false)
        }
      })
      .catch((error) => {
        if (!cancelled) {
          setQueue(null)
          setQueueError(error.message)
          setLoadingQueue(false)
        }
      })
    return () => {
      cancelled = true
    }
  }, [pro, source, id, selectedOffline])

  useEffect(() => () => sessionRef.current?.stop(), [])

  useEffect(() => {
    setQuery('')
    setPage(1)
  }, [source])

  function chooseSource(next) {
    setQueueError('')
    setParams(next ? { source: next } : {})
  }

  function chooseItem(itemId) {
    setParams({ source, id: itemId })
  }

  function toggleOffline(packId) {
    setSelectedOffline((current) => {
      const next = new Set(current || [])
      if (next.has(packId)) {
        next.delete(packId)
      } else {
        next.add(packId)
      }
      return next
    })
  }

  function armPlayback() {
    if (!ready || Capacitor.getPlatform() !== 'ios') {
      return
    }
    startListenPlayback({ title: 'Zipdeck', artist: 'Zipdeck' })
  }

  function cancelArm() {
    if (Capacitor.getPlatform() === 'ios' && !sessionRef.current) {
      stopListenPlayback()
    }
  }

  function play() {
    if (!ready) {
      return
    }
    sessionRef.current?.stop()
    const session = createListenSession({
      cards,
      options: {
        waitMs: WAITS.find((item) => item.id === wait)?.ms || 4000,
        side,
        loop,
        announce: multi && announce,
      },
      onChange: setPlayback,
    })
    sessionRef.current = session
    session.start()
    setPlaying(true)
  }

  function stopToOptions() {
    sessionRef.current?.stop()
    sessionRef.current = null
    setPlaying(false)
    setPlayback(null)
  }

  if (!pro) {
    return (
      <div className="page">
        <div className="page-title">
          <h1>{t('listen.title')}</h1>
        </div>
        <section className="listen-gate">
          <p className="listen-gate-lead">{t('listen.proLead')}</p>
          <p className="listen-gate-pitch">{t('listen.proMemory')}</p>
          <ul className="pro-feature-list listen-gate-points">
            <li>{t('listen.proPoint1')}</li>
            <li>{t('listen.proPoint2')}</li>
            <li>{t('listen.proPoint3')}</li>
          </ul>
          <div className="listen-uses listen-gate-uses">
            {GATE_SCENES.map((item) => (
              <figure className="listen-use" key={item.scene}>
                <UseScene scene={item.scene} />
                <figcaption>
                  <strong>{t(item.label)}</strong>
                </figcaption>
              </figure>
            ))}
          </div>
          <Link className="btn primary" to="/pro">
            {t('pro.goToPro')}
          </Link>
        </section>
      </div>
    )
  }

  if (playing && playback) {
    return (
      <div className="page listen-session">
        <ListenPlayer
          playback={playback}
          title={queue?.title || playback.card?.deckName}
          loop={loop}
          onBack={stopToOptions}
          onPause={() => sessionRef.current?.pause()}
          onResume={() => sessionRef.current?.resume()}
          onNext={() => sessionRef.current?.next()}
          onPrevious={() => sessionRef.current?.previous()}
          onReplay={() => sessionRef.current?.replay()}
          onRestart={() => sessionRef.current?.restart()}
        />
      </div>
    )
  }

  const showOptions = source === 'offline' ? offlineIds.length > 0 : Boolean(id)
  const sourceMeta = SOURCES.find((item) => item.id === source)
  const needle = query.trim().toLowerCase()
  const filteredItems = (items || []).filter(
    (item) => !needle || String(item.name || '').toLowerCase().includes(needle),
  )
  const totalPages = Math.max(1, Math.ceil(filteredItems.length / PAGE_SIZE))
  const safePage = Math.min(page, totalPages)
  const pageItems = filteredItems.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)
  const showBrowse = source && (source === 'offline' || !id)

  return (
    <div className="page">
      <div className="page-title">
        <h1>{t('listen.title')}</h1>
      </div>
      {queueError ? <div className="error">{translateError(t, queueError)}</div> : null}

      {!source ? (
        <div className="listen-source-grid">
          <p className="listen-pick">{t('listen.pick')}</p>
          {SOURCES.map((item) => (
            <button key={item.id} className="choice listen-source" type="button" onClick={() => chooseSource(item.id)}>
              <MenuIcon name={item.icon} />
              <span>{t(`listen.source${item.id[0].toUpperCase()}${item.id.slice(1)}`)}</span>
            </button>
          ))}
        </div>
      ) : null}

      {showBrowse ? (
        <div className="listen-browse">
          <button className="page-back" type="button" onClick={() => chooseSource('')}>
            {t('listen.back')}
          </button>
          <div className="listen-browse-bar">
            <span className="listen-browse-mark">
              <MenuIcon name={sourceMeta.icon} />
            </span>
            <h2>{t(`listen.source${source[0].toUpperCase()}${source.slice(1)}`)}</h2>
            {items && items.length > 0 ? (
              <label className="listen-search">
                <span className="admin-sr">{t('listen.searchLabel')}</span>
                <input
                  type="search"
                  value={query}
                  placeholder={t('listen.searchPlaceholder')}
                  autoComplete="off"
                  onChange={(event) => {
                    setQuery(event.target.value)
                    setPage(1)
                  }}
                />
              </label>
            ) : null}
          </div>
          {items === null ? <p>{t('app.loading')}</p> : null}
          {items && items.length === 0 ? (
            <p className="muted">
              {t(
                source === 'deck'
                  ? 'listen.emptyDecks'
                  : source === 'set'
                    ? 'listen.emptySets'
                    : source === 'mix'
                      ? 'listen.emptyMixes'
                      : 'listen.emptyOffline',
              )}
            </p>
          ) : null}
          {items && items.length > 0 && filteredItems.length === 0 ? (
            <p className="muted">{t('listen.noMatches')}</p>
          ) : null}
          {pageItems.length > 0 ? (
            <div className="listen-browse-grid">
              {pageItems.map((item) => {
                const color = itemColor(item)
                const count =
                  source === 'deck' || source === 'offline'
                    ? t('listen.cards', { count: source === 'offline' ? item.cards?.length || 0 : item.cardCount || 0 })
                    : t('listen.decks', { count: item.deckCount || item.deckIds?.length || 0 })
                const body = (
                  <span>
                    {color ? <span className="listen-swatch" style={{ background: color }} /> : null}
                    <strong>{item.name}</strong>
                    <span className="muted">{count}</span>
                  </span>
                )
                if (source === 'offline') {
                  const checked = selectedOffline?.has(item.id) || false
                  return (
                    <label key={item.id} className={`choice listen-item listen-check${checked ? ' is-on' : ''}`}>
                      <input type="checkbox" checked={checked} onChange={() => toggleOffline(item.id)} />
                      {body}
                    </label>
                  )
                }
                return (
                  <button key={item.id} className="choice listen-item" type="button" onClick={() => chooseItem(item.id)}>
                    {body}
                  </button>
                )
              })}
            </div>
          ) : null}
          {items && filteredItems.length > PAGE_SIZE ? (
            <div className="library-pager">
              {safePage > 1 ? (
                <button className="btn" type="button" onClick={() => setPage(safePage - 1)}>
                  {t('listen.previous')}
                </button>
              ) : null}
              <p className="muted">{t('listen.pageStatus', { page: safePage, total: totalPages })}</p>
              {safePage < totalPages ? (
                <button className="btn" type="button" onClick={() => setPage(safePage + 1)}>
                  {t('listen.next')}
                </button>
              ) : null}
            </div>
          ) : null}
        </div>
      ) : null}

      {showOptions ? (
        <div className="listen-setup">
          {source !== 'offline' ? (
            <button className="page-back" type="button" onClick={() => chooseSource(source)}>
              {t('listen.back')}
            </button>
          ) : null}
          <div className="listen-browse-bar">
            <span className="listen-browse-mark">
              <MenuIcon name={sourceMeta.icon} />
            </span>
            <div>
              <h2>{queue?.title || t(`listen.source${source[0].toUpperCase()}${source.slice(1)}`)}</h2>
              {cards.length > 0 ? <p className="muted">{t('listen.cards', { count: cards.length })}</p> : null}
            </div>
          </div>
          <div className="listen-setup-grid">
            <fieldset className="listen-panel">
              <legend>{t('listen.wait')}</legend>
              <div className="listen-choice-row">
                {WAITS.map((item) => (
                  <button
                    key={item.id}
                    className={`btn${wait === item.id ? ' primary' : ''}`}
                    type="button"
                    aria-pressed={wait === item.id}
                    onClick={() => setWait(item.id)}
                  >
                    {t(`listen.wait${item.id[0].toUpperCase()}${item.id.slice(1)}`)}
                  </button>
                ))}
              </div>
            </fieldset>
            <fieldset className="listen-panel">
              <legend>{t('listen.side')}</legend>
              <div className="listen-choice-row">
                {['front', 'back'].map((item) => (
                  <button
                    key={item}
                    className={`btn${side === item ? ' primary' : ''}`}
                    type="button"
                    aria-pressed={side === item}
                    onClick={() => setSide(item)}
                  >
                    {t(item === 'front' ? 'listen.sideFront' : 'listen.sideBack')}
                  </button>
                ))}
              </div>
            </fieldset>
          </div>
          <div className="listen-panel listen-switches">
            <label className="listen-toggle">
              <input type="checkbox" checked={loop} onChange={(event) => setLoop(event.target.checked)} />
              <span>{t('listen.loop')}</span>
            </label>
            {multi ? (
              <label className="listen-toggle">
                <input type="checkbox" checked={announce} onChange={(event) => setAnnounce(event.target.checked)} />
                <span>{t('listen.announce')}</span>
              </label>
            ) : null}
          </div>
          {loadingQueue ? <p>{t('listen.loading')}</p> : null}
          {!loadingQueue && queue && cards.length === 0 ? <p>{t('listen.emptyCards')}</p> : null}
          {Capacitor.getPlatform() === 'android' ? (
            <p className="muted listen-lock-note">{t('listen.lockNoteAndroid')}</p>
          ) : null}
          {Capacitor.getPlatform() === 'ios' ? (
            <p className="muted listen-lock-note">{t('listen.lockNoteIos')}</p>
          ) : null}
          <button
            className="btn primary listen-play"
            type="button"
            disabled={!ready}
            onPointerDown={armPlayback}
            onPointerCancel={cancelArm}
            onClick={play}
          >
            <MenuIcon name="listen" />
            {t('listen.play')}
          </button>
          <p className="muted listen-schedule">{t('listen.schedule')}</p>
        </div>
      ) : null}
    </div>
  )
}
