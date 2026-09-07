import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { api } from '../api'
import { formatDate } from '../i18n/format'
import { translateError } from '../i18n/errors'
import { GroupBadge } from './ColorPicker'
import { useAuth } from '../AuthContext'
import { sortDecks } from '../deckSort'

export default function DecksPage() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [decks, setDecks] = useState([])
  const [groups, setGroups] = useState([])
  const [groupFilter, setGroupFilter] = useState('')
  const [creating, setCreating] = useState(false)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function load() {
    const [deckData, groupData] = await Promise.all([api('/api/decks'), api('/api/groups')])
    setDecks(deckData)
    setGroups(groupData)
  }

  useEffect(() => {
    load().catch((err) => setError(err.message))
  }, [])

  function closeCreate() {
    if (busy) {
      return
    }
    setCreating(false)
    setName('')
    setDescription('')
    setError('')
  }

  async function createDeck(event) {
    event.preventDefault()
    setError('')
    setBusy(true)
    try {
      const deck = await api('/api/decks', {
        method: 'POST',
        body: JSON.stringify({ name, description, groupId: null }),
      })
      setName('')
      setDescription('')
      setCreating(false)
      navigate(`/decks/${deck.id}`)
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  const visibleDecks = sortDecks(
    groupFilter ? decks.filter((deck) => String(deck.group?.id) === groupFilter) : decks,
    user?.deckSort,
  )

  return (
    <div className="page">
      <div className="page-title">
        <div>
          <h1>{t('decks.title')}</h1>
          <p className="muted">{t('decks.subtitle')}</p>
        </div>
        <button
          className="btn primary"
          type="button"
          onClick={() => {
            setError('')
            setCreating(true)
          }}
        >
          {t('decks.createDeck')}
        </button>
      </div>
      {error && !creating ? <div className="error">{translateError(t, error)}</div> : null}
      {decks.length === 0 ? (
        <div className="empty">{t('decks.empty')}</div>
      ) : (
        <>
          {groups.length > 0 ? (
            <label className="deck-filter">
              {t('decks.filterGroup')}
              <select value={groupFilter} onChange={(event) => setGroupFilter(event.target.value)}>
                <option value="">{t('decks.allGroups')}</option>
                {groups.map((group) => (
                  <option key={group.id} value={String(group.id)}>
                    {group.name}
                  </option>
                ))}
              </select>
            </label>
          ) : null}
          {visibleDecks.length === 0 ? (
            <div className="empty">{t('decks.emptyFiltered')}</div>
          ) : (
            <div className="deck-grid">
              {visibleDecks.map((deck) => (
                <Link key={deck.id} to={`/decks/${deck.id}`} className="deck-card">
                  <GroupBadge group={deck.group} />
                  <h2>{deck.name}</h2>
                  <p className="muted">{deck.description || t('decks.noDescription')}</p>
                  <div className="stat-row">
                    <span>{t('decks.cards', { count: deck.cardCount })}</span>
                    <span className="due-badge">{t('decks.due', { count: deck.dueCount })}</span>
                    <span>{t('decks.learned', { count: deck.learnedCount })}</span>
                  </div>
                  {deck.lastStudiedAt ? (
                    <p className="muted small">{t('decks.lastStudied', { date: formatDate(deck.lastStudiedAt) })}</p>
                  ) : (
                    <p className="muted small">{t('decks.notStudied')}</p>
                  )}
                </Link>
              ))}
            </div>
          )}
        </>
      )}
      {creating ? (
        <div className="modal-backdrop" onClick={closeCreate}>
          <form className="modal" onClick={(event) => event.stopPropagation()} onSubmit={createDeck}>
            <h2>{t('decks.createDeckTitle')}</h2>
            {error ? <div className="error">{translateError(t, error)}</div> : null}
            <label>
              {t('decks.deckName')}
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                required
                autoFocus
              />
            </label>
            <label>
              {t('decks.description')}
              <textarea
                value={description}
                maxLength={2000}
                placeholder={t('decks.descriptionPlaceholder')}
                onChange={(event) => setDescription(event.target.value)}
              />
            </label>
            <div className="header-actions">
              <button className="btn primary" type="submit" disabled={busy}>
                {busy ? t('common.saving') : t('decks.createDeck')}
              </button>
              <button className="btn ghost" type="button" onClick={closeCreate} disabled={busy}>
                {t('common.cancel')}
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </div>
  )
}
