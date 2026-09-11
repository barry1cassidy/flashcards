import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { api } from '../api'
import { formatDate } from '../i18n/format'
import { translateError } from '../i18n/errors'
import ConfirmModal from './ConfirmModal'

export default function ClassDetailPage() {
  const { t } = useTranslation()
  const { id } = useParams()
  const navigate = useNavigate()
  const [detail, setDetail] = useState(null)
  const [allDecks, setAllDecks] = useState([])
  const [name, setName] = useState('')
  const [addDeckId, setAddDeckId] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [copied, setCopied] = useState(false)
  const [confirm, setConfirm] = useState(null)

  async function load() {
    const classDetail = await api(`/api/classes/${id}`)
    setDetail(classDetail)
    setName(classDetail.name)
    if (classDetail.role === 'TEACHER') {
      setAllDecks(await api('/api/decks'))
    } else {
      setAllDecks([])
    }
  }

  useEffect(() => {
    load().catch((err) => setError(err.message))
  }, [id])

  const teacher = detail?.role === 'TEACHER'
  const assignedIds = new Set((detail?.decks || []).map((deck) => String(deck.deckId)))
  const availableDecks = allDecks.filter((deck) => !assignedIds.has(String(deck.id)))
  const joinUrl = detail?.joinCode ? `${window.location.origin}/join/${detail.joinCode}` : ''

  async function saveName(event) {
    event.preventDefault()
    setError('')
    setBusy(true)
    try {
      const updated = await api(`/api/classes/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ name: name.trim() }),
      })
      setDetail(updated)
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  async function copyLink() {
    if (!joinUrl) {
      return
    }
    try {
      await navigator.clipboard.writeText(joinUrl)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    } catch {
      setError(t('classes.copyFailed'))
    }
  }

  async function regenerate() {
    setConfirm(null)
    setError('')
    setBusy(true)
    try {
      setDetail(await api(`/api/classes/${id}/join-code`, { method: 'POST' }))
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  async function assignDeck(event) {
    event.preventDefault()
    if (!addDeckId) {
      return
    }
    setError('')
    setBusy(true)
    try {
      setDetail(await api(`/api/classes/${id}/decks`, {
        method: 'POST',
        body: JSON.stringify({ deckId: addDeckId }),
      }))
      setAddDeckId('')
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  async function unassignDeck(deckId) {
    setConfirm(null)
    setError('')
    setBusy(true)
    try {
      setDetail(await api(`/api/classes/${id}/decks/${deckId}`, { method: 'DELETE' }))
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  async function removeMember(userId) {
    setConfirm(null)
    setError('')
    setBusy(true)
    try {
      setDetail(await api(`/api/classes/${id}/members/${userId}`, { method: 'DELETE' }))
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  async function leaveClass() {
    setConfirm(null)
    setError('')
    setBusy(true)
    try {
      await api(`/api/classes/${id}/membership`, { method: 'DELETE' })
      navigate('/classes')
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  async function deleteClass() {
    setConfirm(null)
    setError('')
    setBusy(true)
    try {
      await api(`/api/classes/${id}`, { method: 'DELETE' })
      navigate('/classes')
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  async function copyDeck(deckId) {
    setError('')
    setBusy(true)
    try {
      await api(`/api/classes/${id}/decks/${deckId}/copy`, { method: 'POST' })
      await load()
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  async function updateDeck(deckId) {
    setError('')
    setBusy(true)
    try {
      await api(`/api/classes/${id}/decks/${deckId}/update`, { method: 'POST' })
      await load()
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  if (!detail) {
    return (
      <div className="page">
        <p>{error ? translateError(t, error) : t('app.loading')}</p>
      </div>
    )
  }

  return (
    <div className="page">
      <div className="page-title">
        <div>
          <Link className="page-back" to="/classes">
            {t('classes.back')}
          </Link>
          <h1>{detail.name}</h1>
          <p className="muted">
            {teacher
              ? t('classes.teacherMeta', { members: detail.memberCount, decks: detail.decks.length })
              : t('classes.taughtBy', { name: detail.teacherName })}
          </p>
        </div>
        {teacher ? (
          <button className="btn danger" type="button" onClick={() => setConfirm('delete')}>
            {t('classes.deleteClass')}
          </button>
        ) : (
          <button className="btn danger" type="button" onClick={() => setConfirm('leave')}>
            {t('classes.leaveClass')}
          </button>
        )}
      </div>
      {error ? <div className="error">{translateError(t, error)}</div> : null}

      {teacher ? (
        <>
          <section className="card-form">
            <h2 className="section-heading">{t('classes.editClass')}</h2>
            <form className="create-row" onSubmit={saveName}>
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                required
                maxLength={120}
                aria-label={t('classes.className')}
              />
              <button className="btn primary" type="submit" disabled={busy || !name.trim()}>
                {busy ? t('common.saving') : t('common.save')}
              </button>
            </form>
          </section>

          <section className="card-form">
            <h2 className="section-heading">{t('classes.joinCode')}</h2>
            <p className="muted">{t('classes.joinCodeHint')}</p>
            <p className="class-join-code">{detail.joinCode}</p>
            <p className="muted class-join-url">{joinUrl}</p>
            <div className="header-actions">
              <button className="btn primary" type="button" onClick={copyLink}>
                {copied ? t('classes.copied') : t('classes.copyLink')}
              </button>
              <button className="btn" type="button" disabled={busy} onClick={() => setConfirm('regenerate')}>
                {t('classes.newCode')}
              </button>
            </div>
          </section>

          <section className="card-form">
            <h2 className="section-heading">{t('classes.assignedDecks')}</h2>
            {allDecks.length === 0 ? (
              <div className="group-add-empty">
                <p className="muted">{t('classes.noDecksYet')}</p>
                <Link className="btn primary" to="/?create=1">
                  {t('classes.createADeck')}
                </Link>
              </div>
            ) : availableDecks.length === 0 ? (
              <p className="muted">{t('classes.allDecksAssigned')}</p>
            ) : (
              <form className="create-row" onSubmit={assignDeck}>
                <select value={addDeckId} onChange={(event) => setAddDeckId(event.target.value)} required>
                  <option value="">{t('classes.chooseADeck')}</option>
                  {availableDecks.map((deck) => (
                    <option key={deck.id} value={deck.id}>
                      {deck.name}
                    </option>
                  ))}
                </select>
                <button className="btn primary" type="submit" disabled={busy}>
                  {t('classes.assignDeck')}
                </button>
              </form>
            )}
          </section>
        </>
      ) : null}

      {(detail.decks || []).length === 0 ? (
        <div className="empty">{t('classes.noAssignedDecks')}</div>
      ) : (
        <ul className="card-list">
          {detail.decks.map((deck) => (
            <li key={deck.deckId} className="card-row class-deck-row">
              <div>
                <strong>{deck.name}</strong>
                {deck.description ? <p className="muted">{deck.description}</p> : null}
                <p className="muted small">
                  {t('decks.cards', { count: deck.cardCount })}
                  {deck.lastStudiedAt
                    ? ` · ${t('decks.lastStudiedInline', { date: formatDate(deck.lastStudiedAt) })}`
                    : ''}
                  {deck.needsUpdate ? ` · ${t('classes.needsUpdate')}` : ''}
                </p>
              </div>
              <div className="header-actions">
                {teacher ? (
                  <>
                    <Link className="btn" to={`/decks/${deck.deckId}`}>
                      {t('classes.openDeck')}
                    </Link>
                    <button className="btn ghost" type="button" onClick={() => setConfirm({ type: 'unassign', deckId: deck.deckId })}>
                      {t('common.remove')}
                    </button>
                  </>
                ) : deck.copiedDeckId ? (
                  <>
                    {deck.needsUpdate ? (
                      <button className="btn primary" type="button" disabled={busy} onClick={() => updateDeck(deck.deckId)}>
                        {t('classes.updateFromClass')}
                      </button>
                    ) : null}
                    <Link className="btn" to={`/decks/${deck.copiedDeckId}`}>
                      {t('library.openInMyDecks')}
                    </Link>
                  </>
                ) : (
                  <button className="btn primary" type="button" disabled={busy} onClick={() => copyDeck(deck.deckId)}>
                    {busy ? t('library.adding') : t('library.addToMyDecks')}
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      {teacher ? (
        <section className="card-form">
          <h2 className="section-heading">{t('classes.roster')}</h2>
          {detail.members.length === 0 ? (
            <p className="muted">{t('classes.emptyRoster')}</p>
          ) : (
            <div className="class-roster">
              {detail.members.map((member) => (
                <article key={member.userId} className="class-roster-card">
                  <div className="class-roster-head">
                    <div>
                      <strong>{member.displayName}</strong>
                      <p className="muted small">{member.email}</p>
                    </div>
                    <button
                      className="btn ghost"
                      type="button"
                      onClick={() => setConfirm({ type: 'remove', userId: member.userId, name: member.displayName })}
                    >
                      {t('classes.removeStudent')}
                    </button>
                  </div>
                  <ul className="class-progress-list">
                    {member.decks.map((deck) => (
                      <li key={deck.deckId}>
                        <span>{deck.name}</span>
                        <span className="muted">
                          {deck.copied
                            ? t('classes.progressCopied', {
                                due: deck.dueCount,
                                learned: deck.learnedCount,
                                last: deck.lastStudiedAt ? formatDate(deck.lastStudiedAt) : t('classes.notStudied'),
                              })
                            : t('classes.progressNotCopied')}
                        </span>
                      </li>
                    ))}
                  </ul>
                </article>
              ))}
            </div>
          )}
        </section>
      ) : null}

      {confirm === 'delete' ? (
        <ConfirmModal
          title={t('classes.deleteTitle')}
          message={t('classes.deleteMessage')}
          confirmLabel={t('classes.deleteClass')}
          danger
          onConfirm={deleteClass}
          onCancel={() => setConfirm(null)}
        />
      ) : null}
      {confirm === 'leave' ? (
        <ConfirmModal
          title={t('classes.leaveTitle')}
          message={t('classes.leaveMessage')}
          confirmLabel={t('classes.leaveClass')}
          danger
          onConfirm={leaveClass}
          onCancel={() => setConfirm(null)}
        />
      ) : null}
      {confirm === 'regenerate' ? (
        <ConfirmModal
          title={t('classes.newCodeTitle')}
          message={t('classes.newCodeMessage')}
          confirmLabel={t('classes.newCode')}
          onConfirm={regenerate}
          onCancel={() => setConfirm(null)}
        />
      ) : null}
      {confirm?.type === 'unassign' ? (
        <ConfirmModal
          title={t('classes.unassignTitle')}
          message={t('classes.unassignMessage')}
          confirmLabel={t('common.remove')}
          onConfirm={() => unassignDeck(confirm.deckId)}
          onCancel={() => setConfirm(null)}
        />
      ) : null}
      {confirm?.type === 'remove' ? (
        <ConfirmModal
          title={t('classes.removeTitle')}
          message={t('classes.removeMessage', { name: confirm.name })}
          confirmLabel={t('classes.removeStudent')}
          danger
          onConfirm={() => removeMember(confirm.userId)}
          onCancel={() => setConfirm(null)}
        />
      ) : null}
    </div>
  )
}
