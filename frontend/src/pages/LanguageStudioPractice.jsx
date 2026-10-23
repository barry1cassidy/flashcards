import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { api } from '../api'
import { useAuth } from '../AuthContext'
import { isProLicensed } from '../pro'
import { useResumeExpiredSubscription } from '../useResumeExpiredSubscription'
import { translateError } from '../i18n/errors'
import { languageName } from '../speechLanguages'
import {
  STUDIO_RATE_KINDS,
  STUDIO_STATUSES,
  sampleToConversation,
  studioLibraryPath,
  studioPairLabel,
  studioStatusLabel,
} from '../languageStudio'
import MenuIcon from './MenuIcon'
import SpeakButton from './SpeakButton'

const RATE_HINTS = {
  LEARNING: 'studio.rateLearningHint',
  GETTING: 'studio.rateGettingHint',
  READY: 'studio.rateReadyHint',
  LEARNED: 'studio.rateLearnedHint',
}

export default function LanguageStudioPractice() {
  const { t } = useTranslation()
  const { user } = useAuth()
  useResumeExpiredSubscription()
  const navigate = useNavigate()
  const { id, slug } = useParams()
  const [params] = useSearchParams()
  const nativeLanguage = params.get('native') || ''
  const targetLanguage = params.get('target') || ''
  const pro = isProLicensed(user)
  const [conversation, setConversation] = useState(null)
  const [error, setError] = useState('')
  const [turn, setTurn] = useState(0)
  const [revealed, setRevealed] = useState(false)
  const [rating, setRating] = useState(false)
  const [saving, setSaving] = useState(false)
  const barRef = useRef(null)

  useEffect(() => {
    if (!pro) {
      return
    }
    const request = slug
      ? api(
          `/api/language-studio/samples/${encodeURIComponent(slug)}?nativeLanguage=${encodeURIComponent(nativeLanguage)}&targetLanguage=${encodeURIComponent(targetLanguage)}`,
        ).then(sampleToConversation)
      : id
        ? api(`/api/language-studio/conversations/${id}`)
        : null
    if (!request) {
      return
    }
    request
      .then((found) => {
        setConversation(found)
        setTurn(0)
        setRevealed(false)
        setRating(false)
      })
      .catch((err) => setError(err.message))
  }, [pro, id, slug, nativeLanguage, targetLanguage])

  const playing = Boolean(pro && conversation) && !rating

  useLayoutEffect(() => {
    if (!playing) {
      return undefined
    }
    function pinLatest() {
      barRef.current?.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'auto' })
    }
    pinLatest()
    const frame = requestAnimationFrame(pinLatest)
    return () => cancelAnimationFrame(frame)
  }, [playing, turn, revealed])

  if (!pro) {
    return (
      <div className="page">
        <section className="card-form">
          <p>{t('studio.proRequired')}</p>
          <Link className="btn primary" to="/pro">
            {t('pro.goToPro')}
          </Link>
        </section>
      </div>
    )
  }

  const turns = conversation?.turns || []
  const current = turns[Math.min(turn, Math.max(turns.length - 1, 0))]
  const mine = current?.role === 'you'
  const last = turn + 1 >= turns.length

  function nextTurn() {
    if (last) {
      setRating(true)
      return
    }
    setTurn((value) => value + 1)
    setRevealed(false)
  }

  async function ensureCopy() {
    if (conversation?.id) {
      return conversation
    }
    if (!slug) {
      throw new Error('Conversation not found')
    }
    const copied = await api(`/api/language-studio/samples/${encodeURIComponent(slug)}/copy`, {
      method: 'POST',
      skipSaving: true,
      body: JSON.stringify({
        nativeLanguage: conversation.nativeLanguage,
        targetLanguage: conversation.targetLanguage,
      }),
    })
    setConversation(copied)
    return copied
  }

  async function choose(status) {
    if (!conversation || saving) {
      return
    }
    setSaving(true)
    setError('')
    try {
      const owned = await ensureCopy()
      await api(`/api/language-studio/conversations/${owned.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      })
      navigate(studioLibraryPath(owned))
    } catch (err) {
      setError(err.message)
      setSaving(false)
    }
  }

  return (
    <div className="page studio-practice">
      <button
        className="page-back"
        type="button"
        onClick={() =>
          navigate(
            slug
              ? '/language-studio/samples'
              : studioLibraryPath(conversation),
          )
        }
      >
        {t('studio.back')}
      </button>
      {error ? <div className="error">{translateError(t, error)}</div> : null}
      {!conversation && !error ? <p>{t('app.loading')}</p> : null}

      {conversation && rating ? (
        <>
          <div className="page-title">
            <div>
              <h1>{t('studio.rateTitle')}</h1>
              <p className="muted">{t('studio.rateIntro')}</p>
            </div>
          </div>
          <div className="rating-row studio-ratings">
            {STUDIO_STATUSES.map((status) => (
              <button
                key={status}
                className={`btn rating ${STUDIO_RATE_KINDS[status]}`}
                type="button"
                disabled={saving}
                onClick={() => choose(status)}
              >
                <span className="rating-label">{studioStatusLabel(status, t)}</span>
                <span className="rating-hint">{t(RATE_HINTS[status])}</span>
              </button>
            ))}
          </div>
          <p className="muted studio-rate-note">{t('studio.rateLearnedNote')}</p>
        </>
      ) : null}

      {conversation && !rating ? (
        <>
          <div className="page-title">
            <div>
              <div className="studio-card-title">
                <h1>{conversation.title}</h1>
                <span className="studio-pill">{conversation.level}</span>
                <span className="studio-pill">{studioPairLabel(conversation, t)}</span>
              </div>
              <p className="muted">
                {t('studio.turnProgress', { current: turn + 1, total: turns.length })}{' '}
                {t('studio.youPlay', {
                  role: conversation.yourRole,
                  native: languageName(conversation.nativeLanguage),
                  target: languageName(conversation.targetLanguage),
                })}
              </p>
            </div>
          </div>

          <div className="studio-chat" aria-live="polite">
            {turns.slice(0, turn + 1).map((item, index) => {
              const yours = item.role === 'you'
              const open = !yours || index < turn || revealed
              return (
                <div key={`${item.speaker}-${index}`} className={`studio-bubble${yours ? ' is-you' : ' is-them'}`}>
                  <p className="studio-speaker">{item.speaker}</p>
                  {yours ? (
                    <>
                      <StudioLine
                        text={item.nativeText}
                        lang={conversation.nativeLanguage}
                        emphasis
                      />
                      {open ? (
                        <StudioLine text={item.targetText} lang={conversation.targetLanguage} />
                      ) : (
                        <p className="muted">{t('studio.sayTarget', { target: languageName(conversation.targetLanguage) })}</p>
                      )}
                    </>
                  ) : (
                    <>
                      <StudioLine
                        text={item.targetText}
                        lang={conversation.targetLanguage}
                        emphasis
                      />
                      <StudioLine text={item.nativeText} lang={conversation.nativeLanguage} muted />
                    </>
                  )}
                </div>
              )
            })}
          </div>

          <div className="studio-practice-bar" ref={barRef}>
            {mine && !revealed ? (
              <AdvanceButton
                icon="reveal"
                label={t('studio.reveal', { target: languageName(conversation.targetLanguage) })}
                onClick={() => setRevealed(true)}
              />
            ) : (
              <AdvanceButton
                icon={last ? 'check' : 'next'}
                label={last ? t('studio.finish') : t('studio.nextTurn')}
                onClick={nextTurn}
              />
            )}
          </div>
        </>
      ) : null}
    </div>
  )
}

function StudioLine({ text, lang, emphasis = false, muted = false }) {
  return (
    <div className={`studio-line-row${muted ? ' is-muted' : ''}`}>
      <p className={emphasis ? 'studio-line' : undefined}>{text}</p>
      <SpeakButton text={text} lang={lang} />
    </div>
  )
}

function AdvanceButton({ icon, label, onClick }) {
  return (
    <button className="studio-advance" type="button" onClick={onClick}>
      <span className={`studio-advance-mark${icon === 'next' ? ' is-next' : ''}`} aria-hidden="true">
        <MenuIcon name={icon} />
      </span>
      <span>{label}</span>
    </button>
  )
}
