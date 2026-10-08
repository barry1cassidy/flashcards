import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import SpeakButton from './SpeakButton'
import { getOfflinePack } from '../offlinePacks'

export default function OfflineStudyPage() {
  const { t } = useTranslation()
  const { deckId } = useParams()
  const [pack, setPack] = useState(undefined)
  const [index, setIndex] = useState(0)
  const [revealed, setRevealed] = useState(false)
  const [hintOpen, setHintOpen] = useState(false)
  const [done, setDone] = useState(false)

  useEffect(() => {
    let cancelled = false
    getOfflinePack(deckId).then((found) => {
      if (!cancelled) {
        setPack(found)
      }
    })
    return () => {
      cancelled = true
    }
  }, [deckId])

  if (pack === undefined) {
    return (
      <div className="page">
        <p>{t('app.loading')}</p>
      </div>
    )
  }

  if (!pack || pack.cards.length === 0) {
    return (
      <div className="page">
        <Link className="page-back" to="/offline">
          {t('offline.back')}
        </Link>
        <p>{t('offline.missing')}</p>
      </div>
    )
  }

  const current = pack.cards[index]

  function restart() {
    setIndex(0)
    setRevealed(false)
    setHintOpen(false)
    setDone(false)
  }

  function next() {
    if (index + 1 >= pack.cards.length) {
      setDone(true)
      return
    }
    setIndex((value) => value + 1)
    setRevealed(false)
    setHintOpen(false)
  }

  return (
    <div className="page study-content offline-study">
      <Link className="page-back" to="/offline">
        {t('offline.back')}
      </Link>
      <div className="page-title">
        <h1>{pack.name}</h1>
        <p className="muted">{t('offline.scheduleNote')}</p>
      </div>
      {done ? (
        <section className="card-form">
          <h2 className="section-heading">{t('offline.doneTitle')}</h2>
          <div className="header-actions">
            <button className="btn primary" type="button" onClick={restart}>
              {t('offline.again')}
            </button>
          </div>
        </section>
      ) : (
        <div className="study-session">
          <p className="muted">
            {t('offline.progress', { current: index + 1, total: pack.cards.length })}
          </p>
          <div className="flip-stage">
            <div className="flip-toolbar">
              <div className="card-heading">
                <div className="eyebrow">{revealed ? t('study.answer') : t('study.question')}</div>
                <SpeakButton
                  text={revealed ? current.back : current.front}
                  lang={revealed ? pack.backLanguage : pack.frontLanguage}
                />
              </div>
              {current.hint ? (
                <button className="btn" type="button" onClick={() => setHintOpen((open) => !open)}>
                  {hintOpen ? t('study.hideHint') : t('study.showHint')}
                </button>
              ) : null}
            </div>
            {hintOpen && current.hint ? <p className="hint-text">{current.hint}</p> : null}
            <div className="flip-card">
              <div className={`flip-inner${revealed ? ' is-flipped' : ''}`}>
                <button
                  className="flip-face flip-face-front"
                  type="button"
                  onClick={(event) => {
                    event.currentTarget.blur()
                    setRevealed(true)
                  }}
                  tabIndex={revealed ? -1 : 0}
                  aria-hidden={revealed}
                >
                  <h2>{current.front}</h2>
                  <span className="flip-cue">{t('study.tapToFlip')}</span>
                </button>
                <div className="flip-face flip-face-back" aria-hidden={!revealed}>
                  <p className="flip-prompt muted">{current.front}</p>
                  <p className="answer">{current.back}</p>
                </div>
              </div>
            </div>
          </div>
          {revealed ? (
            <div className="study-session-actions header-actions">
              <button className="btn primary" type="button" onClick={next}>
                {index + 1 >= pack.cards.length ? t('study.rehearseFinish') : t('study.rehearseNext')}
              </button>
            </div>
          ) : null}
        </div>
      )}
    </div>
  )
}
