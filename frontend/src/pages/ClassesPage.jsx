import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { api } from '../api'
import { useAuth } from '../AuthContext'
import { translateError } from '../i18n/errors'
import { isTeacherMode } from '../teacher'
import MenuIcon from './MenuIcon'

export default function ClassesPage() {
  const { t } = useTranslation()
  const { user, setTeacherMode } = useAuth()
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

  async function changeTeacherMode(next) {
    setError('')
    try {
      await setTeacherMode(next)
    } catch (err) {
      setError(err.message)
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
          <button
            className="btn primary"
            type="button"
            onClick={() => {
              setError('')
              setName('')
              setSearchParams({ new: '1' })
            }}
          >
            {t('classes.newClass')}
          </button>
        ) : null}
      </div>
      {error && !creating ? <div className="error">{translateError(t, error)}</div> : null}

      <ol className="class-how-strip" aria-label={t('classes.howHeading')}>
        <li className="class-how-step">
          <span className="class-how-icon" aria-hidden="true">
            <MenuIcon name="teacher" />
          </span>
          <span className="class-how-copy">
            <strong>{t('classes.howStep1Title')}</strong>
            <span className="muted">{t('classes.howStep1Body')}</span>
          </span>
        </li>
        <li className="class-how-step">
          <span className="class-how-icon" aria-hidden="true">
            <MenuIcon name="joinCode" />
          </span>
          <span className="class-how-copy">
            <strong>{t('classes.howStep2Title')}</strong>
            <span className="muted">{t('classes.howStep2Body')}</span>
          </span>
        </li>
        <li className="class-how-step">
          <span className="class-how-icon" aria-hidden="true">
            <MenuIcon name="deckCopy" />
          </span>
          <span className="class-how-copy">
            <strong>{t('classes.howStep3Title')}</strong>
            <span className="muted">{t('classes.howStep3Body')}</span>
          </span>
        </li>
      </ol>

      <div className="class-paths">
        <section className="class-path class-path-student" aria-labelledby="class-path-student-title">
          <div className="class-path-head">
            <span className="class-path-icon" aria-hidden="true">
              <MenuIcon name="student" />
            </span>
            <div>
              <h2 id="class-path-student-title" className="section-heading">
                {t('classes.studentPathTitle')}
              </h2>
              <p className="muted">{t('classes.studentPathHint')}</p>
            </div>
          </div>
          <form className="create-row class-join-form" onSubmit={joinClass}>
            <input
              value={joinCode}
              onChange={(event) => setJoinCode(event.target.value.toUpperCase())}
              maxLength={6}
              autoCapitalize="characters"
              autoComplete="off"
              spellCheck={false}
              placeholder={t('classes.joinPlaceholder')}
              aria-label={t('classes.joinPlaceholder')}
              className="class-join-input"
            />
            <button className="btn primary" type="submit" disabled={busy || joinCode.trim().length < 6}>
              {t('classes.joinButton')}
            </button>
          </form>
        </section>

        <section className="class-path class-path-teacher" aria-labelledby="class-path-teacher-title">
          <div className="class-path-head">
            <span className="class-path-icon" aria-hidden="true">
              <MenuIcon name="teacher" />
            </span>
            <div>
              <h2 id="class-path-teacher-title" className="section-heading">
                {t('classes.teacherPathTitle')}
              </h2>
              <p className="muted">{t('classes.teacherPathHint')}</p>
            </div>
          </div>
          <div
            className="class-mode-toggle"
            role="radiogroup"
            aria-label={t('settings.teacherMode')}
          >
            <button
              type="button"
              role="radio"
              aria-checked={!teacher}
              className={`class-mode-option ${teacher ? '' : 'selected'}`}
              onClick={() => changeTeacherMode(false)}
            >
              <MenuIcon name="student" />
              <span>{t('classes.modeStudent')}</span>
            </button>
            <button
              type="button"
              role="radio"
              aria-checked={teacher}
              className={`class-mode-option ${teacher ? 'selected' : ''}`}
              onClick={() => changeTeacherMode(true)}
            >
              <MenuIcon name="teacher" />
              <span>{t('classes.modeTeacher')}</span>
            </button>
          </div>
          {teacher ? (
            <div className="class-teacher-actions">
              <p className="muted">{t('classes.teacherModeReady')}</p>
              <button
                className="btn primary"
                type="button"
                onClick={() => {
                  setError('')
                  setName('')
                  setSearchParams({ new: '1' })
                }}
              >
                {t('classes.createClass')}
              </button>
            </div>
          ) : (
            <p className="muted class-teacher-locked">{t('classes.teacherModeLocked')}</p>
          )}
        </section>
      </div>

      {empty ? (
        <div className="empty class-empty">
          {teacher ? t('classes.emptyTeacher') : t('classes.emptyStudent')}
        </div>
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
              {error ? <div className="error">{translateError(t, error)}</div> : null}
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
  const teaching = item.role === 'TEACHER'
  return (
    <Link to={`/classes/${item.id}`} className={`deck-card class-card ${teaching ? 'is-teacher' : 'is-student'}`}>
      <div className="class-card-top">
        <span className={`class-role-badge ${teaching ? 'teacher' : 'student'}`}>
          <MenuIcon name={teaching ? 'teacher' : 'student'} />
          {teaching ? t('classes.roleTeacher') : t('classes.roleStudent')}
        </span>
      </div>
      <h2>{item.name}</h2>
      <p className="muted">
        {teaching
          ? t('classes.teacherMeta', { members: item.memberCount, decks: item.deckCount })
          : t('classes.studentMeta', { teacher: item.teacherName, decks: item.deckCount })}
      </p>
    </Link>
  )
}
