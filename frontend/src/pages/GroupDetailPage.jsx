import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { api } from '../api'
import { formatDate } from '../i18n/format'
import { translateError } from '../i18n/errors'
import ConfirmModal from './ConfirmModal'
import { GroupBadge } from './ColorPicker'
import GroupForm from './GroupForm'
import { useAuth } from '../AuthContext'
import { sortDecks } from '../deckSort'

export default function GroupDetailPage() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const { id } = useParams()
  const navigate = useNavigate()
  const [group, setGroup] = useState(null)
  const [decks, setDecks] = useState([])
  const [allDecks, setAllDecks] = useState([])
  const [addDeckId, setAddDeckId] = useState('')
  const [error, setError] = useState('')
  const [confirmDelete, setConfirmDelete] = useState(false)

  async function load() {
    const [detail, deckData] = await Promise.all([api(`/api/groups/${id}`), api('/api/decks')])
    setGroup(detail.group)
    setDecks(detail.decks)
    setAllDecks(deckData)
  }

  useEffect(() => {
    load().catch((err) => setError(err.message))
  }, [id])

  const availableDecks = allDecks.filter((deck) => String(deck.group?.id) !== String(id))

  async function saveGroup({ name, color }) {
    const updated = await api(`/api/groups/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ name, color }),
    })
    setGroup(updated)
    await load()
  }

  async function addDeck(event) {
    event.preventDefault()
    if (!addDeckId) {
      return
    }
    setError('')
    try {
      await api(`/api/groups/${id}/decks`, {
        method: 'POST',
        body: JSON.stringify({ deckId: addDeckId }),
      })
      setAddDeckId('')
      await load()
    } catch (err) {
      setError(err.message)
    }
  }

  async function removeDeck(deckId) {
    await api(`/api/groups/${id}/decks/${deckId}`, { method: 'DELETE' })
    await load()
  }

  async function deleteGroup() {
    await api(`/api/groups/${id}`, { method: 'DELETE' })
    navigate('/sets')
  }

  if (!group) {
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
          <Link className="page-back" to="/sets">
            {t('nav.backToGroups')}
          </Link>
          <GroupBadge group={group} />
          <h1>{group.name}</h1>
          <p className="muted">{t('groups.decks', { count: group.deckCount })}</p>
        </div>
          <button className="btn danger" type="button" onClick={() => setConfirmDelete(true)}>
            {t('groups.deleteGroup')}
          </button>
        </div>
        {error ? <div className="error">{translateError(t, error)}</div> : null}
        <section className="card-form">
          <h2 className="section-heading">{t('groups.editGroup')}</h2>
          <GroupForm
            key={`${group.id}-${group.updatedAt}`}
            initialName={group.name}
            initialColor={group.color}
            submitLabel={t('groups.saveGroup')}
            onSubmit={saveGroup}
          />
        </section>
        <section className="card-form">
          <h2 className="section-heading">{t('groups.addADeck')}</h2>
          {availableDecks.length === 0 ? (
            <p className="muted">{t('groups.allDecksInGroup')}</p>
          ) : (
            <form className="create-row" onSubmit={addDeck}>
              <select value={addDeckId} onChange={(e) => setAddDeckId(e.target.value)} required>
                <option value="">{t('groups.chooseADeck')}</option>
                {availableDecks.map((deck) => (
                  <option key={deck.id} value={deck.id}>
                    {deck.name}
                    {deck.group ? ` ${t('groups.inGroup', { name: deck.group.name })}` : ''}
                  </option>
                ))}
              </select>
              <button className="btn primary" type="submit">
                {t('groups.addToGroup')}
              </button>
            </form>
          )}
        </section>
        {decks.length === 0 ? (
          <div className="empty">{t('groups.empty')}</div>
        ) : (
          <ul className="card-list">
            {sortDecks(decks, user?.deckSort).map((deck) => (
              <li key={deck.id} className="card-row">
                <div>
                  <Link to={`/decks/${deck.id}`}>
                    <strong>{deck.name}</strong>
                  </Link>
                  <p className="muted small">
                    {t('decks.cards', { count: deck.cardCount })}
                    {deck.lastStudiedAt ? ` · ${t('decks.lastStudiedInline', { date: formatDate(deck.lastStudiedAt) })}` : ''}
                  </p>
                </div>
                <button className="btn ghost" type="button" onClick={() => removeDeck(deck.id)}>
                  {t('common.remove')}
                </button>
              </li>
            ))}
          </ul>
        )}
      {confirmDelete ? (
        <ConfirmModal
          title={t('groups.deleteGroupTitle')}
          message={t('groups.deleteGroupMessage')}
          confirmLabel={t('groups.deleteGroup')}
          danger
          onConfirm={deleteGroup}
          onCancel={() => setConfirmDelete(false)}
        />
      ) : null}
    </div>
  )
}
