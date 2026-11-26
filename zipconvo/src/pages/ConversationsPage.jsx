import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { api } from '../api'
import { useAuth } from '../auth'
import ChoiceMenu from '../ChoiceMenu'
import { translateError } from '../i18n/errors'
import { languageName } from '../languages'
import ConversationCover from '../ConversationCover'
import { customCover } from '../covers'
import { isProLicensed } from '../pro'
import { MoreScenes } from '../ProStrip'
import { SAMPLE_LANGUAGES, gradeClass, gradeLabel, placeLabel, sceneImage } from '../studio'

export default function ConversationsPage() {
  const { t, i18n } = useTranslation()
  const { user } = useAuth()
  const pro = isProLicensed(user)
  const [pairs, setPairs] = useState([])
  const [pairKey, setPairKey] = useState('')
  const [items, setItems] = useState([])
  const [group, setGroup] = useState('practicing')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!pro) {
      setPairs([])
      setItems([])
      setLoading(false)
      return undefined
    }
    let cancelled = false
    api('/api/language-studio/pairs')
      .then((rows) => {
        if (cancelled) {
          return
        }
        const list = rows || []
        setPairs(list)
        if (list[0]) {
          setPairKey(keyOf(list[0]))
        } else {
          setLoading(false)
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err.message === 'Pro license required' ? '' : err.message)
          setPairs([])
          setLoading(false)
        }
      })
    return () => {
      cancelled = true
    }
  }, [pro])

  useEffect(() => {
    const pair = pairs.find((item) => keyOf(item) === pairKey)
    if (!pair) {
      return undefined
    }
    let cancelled = false
    setLoading(true)
    const query = `nativeLanguage=${encodeURIComponent(pair.nativeLanguage)}&targetLanguage=${encodeURIComponent(pair.targetLanguage)}`
    api(`/api/language-studio/conversations?${query}`)
      .then((rows) => {
        if (!cancelled) {
          setItems(rows || [])
          setError('')
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err.message === 'Pro license required' ? '' : err.message)
          setItems([])
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false)
        }
      })
    return () => {
      cancelled = true
    }
  }, [pairKey, pairs])

  const practicing = items.filter((item) => item.status !== 'LEARNED')
  const learned = items.filter((item) => item.status === 'LEARNED')
  const showGroups = practicing.length > 0 && learned.length > 0
  const visible = showGroups ? (group === 'learned' ? learned : practicing) : items
  const selected = pairs.find((item) => keyOf(item) === pairKey)

  if (!loading && !error && items.length === 0 && pairs.length === 0) {
    return <StartHome pro={pro} language={i18n.language} />
  }

  return (
    <main className="screen">
      <div className="screen-copy">
        <h1>{t('conversations.title')}</h1>
        {selected ? (
          <p>
            {t('conversations.pair', {
              native: languageName(selected.nativeLanguage),
              target: languageName(selected.targetLanguage),
            })}
          </p>
        ) : (
          <p>{t('conversations.start')}</p>
        )}
      </div>

      {pairs.length > 1 ? (
        <ChoiceMenu
          id="conversation-pair"
          className="field"
          label={t('conversations.languagePair')}
          value={pairKey}
          options={pairs.map((pair) => ({
            value: keyOf(pair),
            label: `${languageName(pair.nativeLanguage)} → ${languageName(pair.targetLanguage)}`,
          }))}
          onChange={setPairKey}
        />
      ) : null}

      {showGroups ? (
        <div
          className="list-tabs"
          role="tablist"
          aria-label={t('conversations.filters')}
          onKeyDown={(event) => {
            if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') {
              return
            }
            event.preventDefault()
            const next = group === 'practicing' ? 'learned' : 'practicing'
            setGroup(next)
            const target = event.currentTarget.querySelector(`[data-group="${next}"]`)
            if (target instanceof HTMLElement) {
              target.focus()
            }
          }}
        >
          <Filter status="practicing" label={t('conversations.toPractice')} count={practicing.length} group={group} setGroup={setGroup} />
          <Filter status="learned" label={t('conversations.fullyLearned')} count={learned.length} group={group} setGroup={setGroup} />
        </div>
      ) : null}

      {error ? <p className="error">{translateError(error)}</p> : null}
      {loading ? <p className="empty">{t('loading')}</p> : null}
      {!loading && !error && visible.length === 0 ? (
        <p className="empty">
          {items.length === 0 ? t('conversations.empty') : t('conversations.filterEmpty')}{' '}
          <Link to="/scenes">{t('conversations.chooseScene')}</Link>
        </p>
      ) : null}

      <div className="conversation-list">
        {visible.map((item) => {
          const image = sceneImage(item.scenario)
          const cover = image ? null : customCover(item.id)
          return (
            <Link key={item.id} className="conversation-card has-scene" to={`/conversations/${item.id}`}>
              {image ? <img className="conversation-scene" src={image} alt="" /> : (
                <ConversationCover motif={cover.motif} palette={cover.palette} />
              )}
              <div className="card-copy">
                <div className="card-title">
                  <h2>{item.title}</h2>
                  <span className="pill">{item.level}</span>
                </div>
                <p className={`grade grade-${gradeClass(item.status, item.ratedAt)}`}>
                  {gradeLabel(item.status, item.ratedAt)}
                </p>
                <p className="card-meta">
                  {placeLabel(item.scenario)} · {t('conversations.turns', { count: item.turnCount })}
                </p>
                <span className="card-action">{t('conversations.practice')}</span>
              </div>
            </Link>
          )
        })}
      </div>
    </main>
  )
}

function Filter({ status, label, count, group, setGroup }) {
  const selected = group === status
  return (
    <button
      type="button"
      role="tab"
      data-group={status}
      aria-selected={selected}
      tabIndex={selected ? 0 : -1}
      onClick={() => setGroup(status)}
    >
      {label} <span className="count">({count})</span>
    </button>
  )
}

function StartHome({ pro, language }) {
  const { t } = useTranslation()
  const target = sampleTargetFor(language)
  const query = `native=en-US&target=${encodeURIComponent(target)}`
  if (pro) {
    return (
      <main className="screen is-fit start-home">
        <div className="screen-copy">
          <h1 className="start-title">{t('conversations.proEmptyTitle')}</h1>
          <p>{t('conversations.proEmptyLede')}</p>
        </div>
        <div className="start-actions">
          <Link className="btn email" to="/scenes">
            {t('conversations.createScene')}
          </Link>
        </div>
        <MoreScenes to="/scenes?view=samples" />
      </main>
    )
  }
  return (
    <main className="screen is-fit start-home">
      <div className="screen-copy">
        <h1 className="start-title">{t('conversations.startTitle')}</h1>
        <p>{t('conversations.startLede')}</p>
      </div>
      <ol className="start-steps">
        <li>
          <StepIcon name="hear" />
          <strong>{t('conversations.stepHear')}</strong>
          <span>{t('conversations.stepHearHint')}</span>
        </li>
        <li>
          <StepIcon name="say" />
          <strong>{t('conversations.stepSay')}</strong>
          <span>{t('conversations.stepSayHint')}</span>
        </li>
        <li>
          <StepIcon name="see" />
          <strong>{t('conversations.stepSee')}</strong>
          <span>{t('conversations.stepSeeHint')}</span>
        </li>
      </ol>
      <section className="start-sample">
        <img src="/scenes/scene-cafe.jpg" alt="" />
        <div>
          <p className="start-kicker">{t('conversations.sampleKicker')}</p>
          <h2>{t('scenes.cafeTitle')}</h2>
          <p>
            {t('conversations.sampleBody', {
              native: languageName('en-US'),
              target: languageName(target),
            })}
          </p>
        </div>
        <Link className="btn email" to={`/samples/cafe?${query}`}>
          {t('conversations.startSample')}
        </Link>
      </section>
      <Link className="start-more" to="/scenes">
        <span className="start-more-photos">
          <img src="/scenes/scene-airport.jpg" alt="" />
          <img src="/scenes/scene-restaurant.jpg" alt="" />
          <img src="/scenes/scene-taxi.jpg" alt="" />
          <img src="/scenes/scene-hotel.jpg" alt="" />
        </span>
        <span className="start-more-copy">
          <strong>{t('conversations.moreScenes')}</strong>
          <span>{t('conversations.moreScenesHint')}</span>
        </span>
      </Link>
      <section className="start-pro">
        <p className="start-pro-badge">{t('conversations.proKicker')}</p>
        <div>
          <h2>{t('conversations.proTitle')}</h2>
          <p>{t('conversations.proPitchHome')}</p>
        </div>
        <ul className="start-pro-examples">
          <li>
            <img src="/scenes/scene-interview.jpg" alt="" />
            <span>{t('conversations.proExample1')}</span>
          </li>
          <li>
            <img src="/scenes/scene-pharmacy.jpg" alt="" />
            <span>{t('conversations.proExample2')}</span>
          </li>
          <li>
            <span className="start-pro-own" aria-hidden="true">+</span>
            <span>{t('conversations.proExample3')}</span>
          </li>
        </ul>
        <Link className="btn upgrade" to="/pro">
          {t('conversations.upgrade')}
        </Link>
      </section>
    </main>
  )
}

function StepIcon({ name }) {
  const common = {
    viewBox: '0 0 24 24',
    'aria-hidden': true,
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.8,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
  }
  if (name === 'hear') {
    return (
      <svg {...common}>
        <path d="M4 13a8 8 0 0 1 16 0" />
        <path d="M6 16.5v.5a2 2 0 0 0 2 2h1v-5H8a2 2 0 0 0-2 2.5z" />
        <path d="M18 16.5v.5a2 2 0 0 1-2 2h-1v-5h1a2 2 0 0 1 2 2.5z" />
      </svg>
    )
  }
  if (name === 'say') {
    return (
      <svg {...common}>
        <path d="M12 4v10" />
        <path d="M8.5 8.5a3.5 3.5 0 1 0 7 0" />
        <path d="M7 14a5 5 0 0 0 10 0" />
        <path d="M12 19v2" />
      </svg>
    )
  }
  return (
    <svg {...common}>
      <path d="M5 6.5h14" />
      <path d="M5 12h14" />
      <path d="M5 17.5h9" />
    </svg>
  )
}

function sampleTargetFor(language) {
  const code = String(language || 'en').slice(0, 2).toLowerCase()
  if (code === 'en') {
    return 'es-ES'
  }
  return SAMPLE_LANGUAGES.find((item) => item.toLowerCase().startsWith(code)) || 'es-ES'
}

function keyOf(pair) {
  return `${pair.nativeLanguage}::${pair.targetLanguage}`
}
