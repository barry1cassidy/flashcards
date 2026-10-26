import { useEffect, useRef, useState } from 'react'
import { Capacitor } from '@capacitor/core'
import { Link, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { flattenListenCards, loadListenQueue } from '../listenQueue'
import { LISTEN_SLEEP_EXTEND_MS, defaultListenPrefs, normalizeListenPrefs } from '../listenPrefs'
import { createListenSession } from '../listenSession'
import { listOfflinePacks } from '../offlinePacks'
import ListenOptions, { ListenOptionsToggle, listenPrefsSummary } from './ListenOptions'
import ListenPlayer from './ListenPlayer'
import MenuIcon from './MenuIcon'

const PAGE_SIZE = 8

export default function OfflineListenPage() {
  const { t } = useTranslation()
  const [params] = useSearchParams()
  const wantedId = params.get('id') || ''
  const [packs, setPacks] = useState(null)
  const [selected, setSelected] = useState(null)
  const [prefs, setPrefs] = useState(() => defaultListenPrefs())
  const [optionsOpen, setOptionsOpen] = useState(false)
  const [queue, setQueue] = useState(null)
  const [queueError, setQueueError] = useState('')
  const [loadingQueue, setLoadingQueue] = useState(false)
  const [playing, setPlaying] = useState(false)
  const [playback, setPlayback] = useState(null)
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(1)
  const sessionRef = useRef(null)
  const prefsRef = useRef(prefs)
  prefsRef.current = prefs

  const ids = [...(selected || [])]
  const multi = (queue?.decks.length || 0) > 1
  const cards = queue ? flattenListenCards(queue.decks) : []
  const ready = Boolean(queue) && !loadingQueue && !queueError && cards.length > 0

  useEffect(() => {
    let cancelled = false
    listOfflinePacks()
      .then((found) => {
        if (cancelled) {
          return
        }
        setPacks(found)
        const allowed = new Set(found.map((pack) => pack.id))
        const start = wantedId && allowed.has(wantedId) ? new Set([wantedId]) : new Set(allowed)
        setSelected(start)
      })
      .catch(() => {
        if (!cancelled) {
          setPacks([])
          setSelected(new Set())
        }
      })
    return () => {
      cancelled = true
    }
  }, [wantedId])

  useEffect(() => {
    if (!ids.length) {
      setQueue(null)
      setLoadingQueue(false)
      return undefined
    }
    let cancelled = false
    setLoadingQueue(true)
    setQueueError('')
    loadListenQueue({ source: 'offline', ids })
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
  }, [selected])

  useEffect(
    () => () => {
      sessionRef.current?.stop()
    },
    [],
  )

  function changePrefs(partial) {
    const next = normalizeListenPrefs({ ...prefsRef.current, ...partial })
    prefsRef.current = next
    setPrefs(next)
  }

  function changeLivePrefs(partial) {
    changePrefs(partial)
    const next = prefsRef.current
    sessionRef.current?.setWaitMs(next.pauseSeconds * 1000)
    sessionRef.current?.setLoop(next.loop)
    sessionRef.current?.setRate(next.rate)
    sessionRef.current?.setQuestionTwice(next.questionTwice)
    sessionRef.current?.setAnswerTwice(next.answerTwice)
  }

  function toggle(packId) {
    setSelected((current) => {
      const next = new Set(current || [])
      if (next.has(packId)) {
        next.delete(packId)
      } else {
        next.add(packId)
      }
      return next
    })
  }

  function play() {
    if (!ready) {
      return
    }
    sessionRef.current?.stop()
    const chosen = prefsRef.current
    const session = createListenSession({
      cards,
      options: {
        waitMs: chosen.pauseSeconds * 1000,
        side: chosen.side,
        loop: chosen.loop,
        announce: multi && chosen.announce,
        sleepMs: chosen.sleepMinutes * 60 * 1000,
        rate: chosen.rate,
        questionTwice: chosen.questionTwice,
        answerTwice: chosen.answerTwice,
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

  if (playing && playback) {
    return (
      <div className="page listen-session">
        <ListenPlayer
          playback={playback}
          title={queue?.title || playback.card?.deckName}
          loop={prefs.loop}
          prefs={prefs}
          onChangePrefs={changeLivePrefs}
          onExtendSleep={() => sessionRef.current?.extendSleep(LISTEN_SLEEP_EXTEND_MS)}
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

  const needle = query.trim().toLowerCase()
  const filtered = (packs || []).filter((pack) => !needle || String(pack.name || '').toLowerCase().includes(needle))
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const safePage = Math.min(page, totalPages)
  const pagePacks = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)

  return (
    <div className="page offline-listen">
      <Link className="page-back" to="/offline">
        {t('offline.back')}
      </Link>
      <div className="page-title">
        <h1>{t('listen.title')}</h1>
      </div>
      <p className="muted">{t('offline.listenIntro')}</p>
      {queueError ? <div className="error">{queueError}</div> : null}

      {packs === null ? <p>{t('app.loading')}</p> : null}
      {packs && packs.length === 0 ? <p className="muted">{t('listen.emptyOffline')}</p> : null}

      {packs && packs.length > 0 ? (
        <div className="listen-browse">
          {packs.length > 1 ? (
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
          <div className="listen-browse-grid">
            {pagePacks.map((pack) => {
              const checked = selected?.has(pack.id) || false
              return (
                <label key={pack.id} className={`choice listen-item listen-check${checked ? ' is-on' : ''}`}>
                  <input type="checkbox" checked={checked} onChange={() => toggle(pack.id)} />
                  <span>
                    <strong>{pack.name}</strong>
                    <span className="muted">{t('listen.cards', { count: pack.cards?.length || 0 })}</span>
                  </span>
                </label>
              )
            })}
          </div>
          {filtered.length > PAGE_SIZE ? (
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

      {packs && packs.length > 0 ? (
        <div className="listen-setup">
          <div className="listen-play-bar">
            <button className="btn primary listen-play" type="button" disabled={!ready} onClick={play}>
              <MenuIcon name="listen" />
              {t('listen.play')}
            </button>
          </div>
          <ListenOptionsToggle
            open={optionsOpen}
            onToggle={() => setOptionsOpen((open) => !open)}
            summary={listenPrefsSummary(prefs, t, multi)}
          />
          {optionsOpen ? <ListenOptions prefs={prefs} onChange={changePrefs} showAnnounce={multi} /> : null}
          {loadingQueue ? <p>{t('listen.loading')}</p> : null}
          {!loadingQueue && queue && cards.length === 0 ? <p>{t('listen.emptyCards')}</p> : null}
          {Capacitor.getPlatform() === 'android' ? (
            <p className="muted listen-lock-note">{t('listen.lockNoteAndroid')}</p>
          ) : null}
          {Capacitor.getPlatform() === 'ios' ? (
            <p className="muted listen-lock-note">{t('listen.lockNoteIos')}</p>
          ) : null}
          <p className="muted listen-schedule">{t('listen.schedule')}</p>
        </div>
      ) : null}
    </div>
  )
}
