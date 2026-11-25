import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { api } from '../api'
import ChoiceMenu from '../ChoiceMenu'
import { translateError } from '../i18n/errors'
import { languageName } from '../languages'
import ConversationCover from '../ConversationCover'
import { customCover } from '../covers'
import { gradeClass, gradeLabel, placeLabel, sceneImage } from '../studio'

export default function ConversationsPage() {
  const { t } = useTranslation()
  const [pairs, setPairs] = useState([])
  const [pairKey, setPairKey] = useState('')
  const [items, setItems] = useState([])
  const [group, setGroup] = useState('practicing')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
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
          setError(err.message)
          setLoading(false)
        }
      })
    return () => {
      cancelled = true
    }
  }, [])

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
          setError(err.message)
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

function keyOf(pair) {
  return `${pair.nativeLanguage}::${pair.targetLanguage}`
}
