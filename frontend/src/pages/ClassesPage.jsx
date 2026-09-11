import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { api } from '../api'
import { useAuth } from '../AuthContext'
import { translateError } from '../i18n/errors'
import { isTeacherMode } from '../teacher'

export default function ClassesPage() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const [data, setData] = useState({ teaching: [], joined: [] })
  const [error, setError] = useState('')
  const [joinCode, setJoinCode] = useState('')
  const [name, setName] = useState('')
  const [busy, setBusy] = useState(false)
  const creating = searchParams.get('new') === '1'
  const teacher = isTeacherMode(user)
  const empty = data.teaching.length === 0 && data.joined.length === 0

  async function load() {
    setData(await api('/api/classes'))
  }

  useEffect(() => {
    load().catch((err) => setError(err.message))
  }, [])

  async function createClass(event) {
    event.preventDefault()
    setError('')
    setBusy(true)
    try {
      const created = await api('/api/classes', {
        method: 'POST',
        body: JSON.stringify({ name: name.trim() }),
      })
      setSearchParams({})
      navigate(`/classes/${created.id}`)
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  async function joinClass(event) {
    event.preventDefault()
    const code = joinCode.trim()
    if (!code) {
      return
    }
    setError('')
    setBusy(true)
    try {
      const joined = await api(`/api/join/${encodeURIComponent(code.toUpperCase())}`, { method: 'POST' })
      navigate(`/classes/${joined.id}`)
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="page">
      <div className="page-title">
        <div>
          <h1>{t('classes.title')}</h1>
          <p className="muted">{t('classes.subtitle')}</p>
        </div>
        {teacher ? (
          <button className="btn primary" type="button" onClick={() => setSearchParams({ new: '1' })}>
            {t('classes.newClass')}
          </button>
        ) : null}
      </div>
      {error ? <div className="error">{translateError(t, error)}</div> : null}

      <section className="card-form">
        <h2 className="section-heading">{t('classes.joinHeading')}</h2>
        <p className="muted">{t('classes.joinHint')}</p>
        <form className="create-row" onSubmit={joinClass}>
          <input
            value={joinCode}
            onChange={(event) => setJoinCode(event.target.value.toUpperCase())}
            maxLength={6}
            autoCapitalize="characters"
            autoComplete="off"
            spellCheck={false}
            placeholder={t('classes.joinPlaceholder')}
            aria-label={t('classes.joinPlaceholder')}
          />
          <button className="btn primary" type="submit" disabled={busy || joinCode.trim().length < 6}>
            {t('classes.joinButton')}
          </button>
        </form>
      </section>

      {empty ? (
        <div className="empty">{teacher ? t('classes.emptyTeacher') : t('classes.emptyStudent')}</div>
      ) : null}

      {data.teaching.length > 0 ? (
        <section>
          <h2 className="section-heading">{t('classes.teaching')}</h2>
          <div className="deck-grid">
            {data.teaching.map((item) => (
              <ClassCard key={item.id} item={item} />
            ))}
          </div>
        </section>
      ) : null}

      {data.joined.length > 0 ? (
        <section>
          <h2 className="section-heading">{t('classes.joined')}</h2>
          <div className="deck-grid">
            {data.joined.map((item) => (
              <ClassCard key={item.id} item={item} />
            ))}
          </div>
        </section>
      ) : null}

      {creating ? (
        <div className="modal-backdrop" onClick={() => setSearchParams({})}>
          <div className="modal" onClick={(event) => event.stopPropagation()}>
            <h2>{t('classes.newTitle')}</h2>
            <p className="muted">{t('classes.newSubtitle')}</p>
            <form className="stack" onSubmit={createClass}>
              <label>
                {t('classes.className')}
                <input
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  required
                  maxLength={120}
                  autoFocus
                />
              </label>
              <div className="header-actions">
                <button className="btn primary" type="submit" disabled={busy || !name.trim()}>
                  {busy ? t('common.saving') : t('classes.createClass')}
                </button>
                <button className="btn ghost" type="button" onClick={() => setSearchParams({})}>
                  {t('common.cancel')}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  )
}

function ClassCard({ item }) {
  const { t } = useTranslation()
  return (
    <Link to={`/classes/${item.id}`} className="deck-card">
      <h2>{item.name}</h2>
      <p className="muted">
        {item.role === 'TEACHER'
          ? t('classes.teacherMeta', { members: item.memberCount, decks: item.deckCount })
          : t('classes.studentMeta', { teacher: item.teacherName, decks: item.deckCount })}
      </p>
    </Link>
  )
}
