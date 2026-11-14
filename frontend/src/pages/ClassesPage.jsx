import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { api } from '../api'
import { useAuth } from '../AuthContext'
import { translateError } from '../i18n/errors'
import { isTeacherMode } from '../teacher'
import { webMarketing } from '../webOnly'
import MenuIcon from './MenuIcon'
import Modal from './Modal'

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
  const howOpen = !webMarketing && searchParams.get('how') === '1'
  const teacher = isTeacherMode(user)
  const empty = data.teaching.length === 0 && data.joined.length === 0
  const backRef = useRef(null)
  const howWasOpen = useRef(null)

  async function load() {
    setData(await api('/api/classes'))
  }

  useEffect(() => {
    load().catch((err) => setError(err.message))
  }, [])

  useLayoutEffect(() => {
    if (webMarketing) {
      return
    }
    const previous = howWasOpen.current
    howWasOpen.current = howOpen
    if (previous === null && !howOpen) {
      return
    }
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' })
    if (howOpen) {
      backRef.current?.focus({ preventScroll: true })
    }
  }, [howOpen])

  function openHow() {
    setSearchParams({ how: '1' })
  }

  function closeHow() {
    const index = window.history.state?.idx
    if (typeof index === 'number' && index > 0) {
      navigate(-1)
      return
    }
    setSearchParams({}, { replace: true })
  }

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

  if (howOpen) {
    return (
      <div className="page classes-how-view">
        <div className="classes-how-sticky">
          <button ref={backRef} className="page-back classes-how-back" type="button" onClick={closeHow}>
            {t('classes.back')}
          </button>
        </div>
        <h1>{t('classes.howHeading')}</h1>
        <ClassHowSteps />
      </div>
    )
  }

  return (
    <div className={webMarketing ? 'page' : 'page classes-native'}>
      <div className="page-title">
        <div>
          <h1>{t('classes.title')}</h1>
          {webMarketing ? <p className="muted">{t('classes.subtitle')}</p> : null}
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

      {webMarketing ? <ClassHowSteps /> : null}

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
                {teacher ? t('classes.teacherPathTitle') : t('settings.teacherMode')}
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
              className={`class-mode-option is-teacher${teacher ? ' selected' : ' is-next'}`}
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

      {webMarketing ? null : (
        <button className="classes-how-open" type="button" onClick={openHow}>
          {t('classes.howHeading')}
        </button>
      )}

      {empty && webMarketing ? (
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
        <Modal
          variant="form"
          as="form"
          title={t('classes.newTitle')}
          onClose={() => setSearchParams({})}
          closeDisabled={busy}
          onSubmit={createClass}
          footer={
            <div className="modal-actions">
              <button className="btn primary" type="submit" disabled={busy || !name.trim()}>
                {busy ? t('common.saving') : t('classes.createClass')}
              </button>
              <button className="btn ghost" type="button" disabled={busy} onClick={() => setSearchParams({})}>
                {t('common.cancel')}
              </button>
            </div>
          }
        >
          <p className="muted">{t('classes.newSubtitle')}</p>
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
        </Modal>
      ) : null}
    </div>
  )
}

function ClassHowSteps() {
  const { t } = useTranslation()
  return (
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
