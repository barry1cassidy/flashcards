import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api'
import { languageName } from '../languages'
import { gradeClass, gradeLabel, placeLabel } from '../studio'

export default function ConversationsPage() {
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
        <h1>Conversations</h1>
        {selected ? (
          <p>
            {languageName(selected.nativeLanguage)} → {languageName(selected.targetLanguage)}
          </p>
        ) : (
          <p>Choose a scene to start the first one.</p>
        )}
      </div>

      {pairs.length > 1 ? (
        <label className="field">
          <span>Language pair</span>
          <select value={pairKey} onChange={(event) => setPairKey(event.target.value)}>
            {pairs.map((pair) => (
              <option key={keyOf(pair)} value={keyOf(pair)}>
                {languageName(pair.nativeLanguage)} → {languageName(pair.targetLanguage)}
              </option>
            ))}
          </select>
        </label>
      ) : null}

      {showGroups ? (
        <div className="filters" role="radiogroup" aria-label="Conversation filters">
          <Filter status="practicing" label={`To practice · ${practicing.length}`} group={group} setGroup={setGroup} />
          <Filter status="learned" label={`Fully learned · ${learned.length}`} group={group} setGroup={setGroup} />
        </div>
      ) : null}

      {error ? <p className="error">{error}</p> : null}
      {loading ? <p className="empty">Loading…</p> : null}
      {!loading && !error && visible.length === 0 ? (
        <p className="empty">
          {items.length === 0 ? 'No conversations yet.' : 'Nothing in this filter yet.'}{' '}
          <Link to="/scenes">Choose a scene</Link>
        </p>
      ) : null}

      <div className="conversation-list">
        {visible.map((item) => (
          <Link key={item.id} className="conversation-card" to={`/conversations/${item.id}`}>
            <div className="card-title">
              <h2>{item.title}</h2>
              <span className="pill">{item.level}</span>
            </div>
            <p className={`grade grade-${gradeClass(item.status, item.ratedAt)}`}>
              {gradeLabel(item.status, item.ratedAt)}
            </p>
            <p className="card-meta">
              {placeLabel(item.scenario)} · {item.turnCount} turns
            </p>
            <span className="card-action">Practice</span>
          </Link>
        ))}
      </div>
    </main>
  )
}

function Filter({ status, label, group, setGroup }) {
  return (
    <button
      className={group === status ? 'is-on' : ''}
      type="button"
      role="radio"
      aria-checked={group === status}
      onClick={() => setGroup(status)}
    >
      {label}
    </button>
  )
}

function keyOf(pair) {
  return `${pair.nativeLanguage}::${pair.targetLanguage}`
}
