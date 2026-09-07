import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { api } from '../api'
import { downloadBlob, csvFilename } from '../download'
import { formatDate } from '../i18n/format'
import { translateError } from '../i18n/errors'
import { normalizeSpeechLanguage } from '../speechLanguages'
import ConfirmModal from './ConfirmModal'
import StudyModeModal from './StudyModeModal'
import { GroupBadge } from './ColorPicker'
import LanguageSelect from './LanguageSelect'
import SpeakButton from './SpeakButton'

function deckUpdateBody(deck, overrides = {}) {
  return {
    name: deck.name,
    description: deck.description || '',
    groupId: deck.group?.id ?? null,
    frontLanguage: deck.frontLanguage,
    backLanguage: deck.backLanguage,
    ...overrides,
  }
}

export default function DeckDetailPage() {
  const { t } = useTranslation()
  const { id } = useParams()
  const navigate = useNavigate()
  const fileRef = useRef(null)
  const dragIndex = useRef(null)
  const [deck, setDeck] = useState(null)
  const [cards, setCards] = useState([])
  const [groups, setGroups] = useState([])
  const [front, setFront] = useState('')
  const [back, setBack] = useState('')
  const [hint, setHint] = useState('')
  const [editing, setEditing] = useState(null)
  const [cardFormOpen, setCardFormOpen] = useState(false)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [confirm, setConfirm] = useState(null)
  const [editingDeck, setEditingDeck] = useState(false)
  const [editName, setEditName] = useState('')
  const [editDescription, setEditDescription] = useState('')
  const [studyOpen, setStudyOpen] = useState(false)

  async function load() {
    const [deckData, cardData, groupData] = await Promise.all([
      api(`/api/decks/${id}`),
      api(`/api/decks/${id}/cards`),
      api('/api/groups'),
    ])
    setDeck(deckData)
    setCards(cardData)
    setGroups(groupData)
  }

  useEffect(() => {
    load().catch((err) => setError(err.message))
  }, [id])

  async function saveCard(event) {
    event.preventDefault()
    setError('')
    setBusy(true)
    try {
      if (editing) {
        await api(`/api/cards/${editing.id}`, {
          method: 'PUT',
          body: JSON.stringify({ front, back, hint }),
        })
      } else {
        await api(`/api/decks/${id}/cards`, {
          method: 'POST',
          body: JSON.stringify({ front, back, hint }),
        })
      }
      setFront('')
      setBack('')
      setHint('')
      setEditing(null)
      setCardFormOpen(false)
      await load()
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  async function deleteCard(cardId) {
    setError('')
    try {
      await api(`/api/cards/${cardId}`, { method: 'DELETE' })
      setConfirm(null)
      await load()
    } catch (err) {
      setError(err.message)
      setConfirm(null)
    }
  }

  async function deleteDeck() {
    await api(`/api/decks/${id}`, { method: 'DELETE' })
    navigate('/')
  }

  async function saveDeck(overrides) {
    const updated = await api(`/api/decks/${id}`, {
      method: 'PUT',
      body: JSON.stringify(deckUpdateBody(deck, overrides)),
    })
    setDeck(updated)
    return updated
  }

  async function saveDeckDetails(event) {
    event.preventDefault()
    const nextName = editName.trim()
    const nextDescription = editDescription.trim()
    if (!nextName) {
      return
    }
    if (nextName === deck.name && nextDescription === (deck.description || '').trim()) {
      setEditingDeck(false)
      return
    }
    setError('')
    try {
      await saveDeck({ name: nextName, description: nextDescription })
      setEditingDeck(false)
    } catch (err) {
      setError(err.message)
    }
  }

  async function importCsv(event) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) {
      return
    }
    setError('')
    try {
      const data = new FormData()
      data.append('file', file)
      await api(`/api/decks/${id}/import`, { method: 'POST', body: data })
      await load()
    } catch (err) {
      setError(err.message)
    }
  }

  async function exportCsv() {
    setError('')
    try {
      const data = await api(`/api/decks/${id}/export`)
      downloadBlob(data, csvFilename(deck?.name))
    } catch (err) {
      setError(err.message)
    }
  }

  async function changeGroup(event) {
    const value = event.target.value
    setError('')
    try {
      await saveDeck({ groupId: value || null })
    } catch (err) {
      setError(err.message)
    }
  }

  async function changeLanguage(side, value) {
    setError('')
    try {
      await saveDeck({ [side]: value })
    } catch (err) {
      setError(err.message)
    }
  }

  async function saveOrder(nextCards) {
    await api(`/api/decks/${id}/cards/order`, {
      method: 'PUT',
      body: JSON.stringify({ cardIds: nextCards.map((card) => card.id) }),
    })
  }

  async function moveCard(from, to) {
    if (to < 0 || to >= cards.length || from === to) {
      return
    }
    const next = [...cards]
    const [item] = next.splice(from, 1)
    next.splice(to, 0, item)
    setCards(next)
    setError('')
    try {
      await saveOrder(next)
    } catch (err) {
      setError(err.message)
      await load()
    }
  }

  function onDragStart(event, index) {
    dragIndex.current = index
    event.dataTransfer.effectAllowed = 'move'
    event.dataTransfer.setData('text/plain', String(index))
  }

  function onDragOver(event) {
    event.preventDefault()
    event.dataTransfer.dropEffect = 'move'
  }

  function onDrop(event, index) {
    event.preventDefault()
    const from = dragIndex.current
    dragIndex.current = null
    if (from == null) {
      return
    }
    moveCard(from, index)
  }

  function openAddCard() {
    setEditing(null)
    setFront('')
    setBack('')
    setHint('')
    setError('')
    setCardFormOpen(true)
  }

  function openEditCard(card) {
    setEditing(card)
    setFront(card.front)
    setBack(card.back)
    setHint(card.hint || '')
    setError('')
    setCardFormOpen(true)
  }

  function closeCardForm() {
    if (busy) {
      return
    }
    setCardFormOpen(false)
    setEditing(null)
    setFront('')
    setBack('')
    setHint('')
  }

  if (!deck) {
    return (
      <div className="page">
        <p>{error ? translateError(t, error) : t('app.loading')}</p>
      </div>
    )
  }

  const stats = [
    t('decks.cards', { count: deck.cardCount }),
    t('decks.due', { count: deck.dueCount }),
    t('decks.learned', { count: deck.learnedCount }),
  ]
  if (deck.lastStudiedAt) {
    stats.push(t('decks.lastStudiedInline', { date: formatDate(deck.lastStudiedAt) }))
  }

  const frontLanguage = normalizeSpeechLanguage(deck.frontLanguage, 'en-US')
  const backLanguage = normalizeSpeechLanguage(deck.backLanguage, 'en-US')

  return (
    <div className="page">
      <div className="page-title">
        <div className="deck-hero">
          <GroupBadge group={deck.group} />
          <h1>{deck.name}</h1>
          {deck.description ? <p>{deck.description}</p> : null}
          <p className="muted">{stats.join(' · ')}</p>
        </div>
        <div className="header-actions">
          <button className="btn primary" type="button" onClick={() => setStudyOpen(true)}>
            {t('decks.study')}
          </button>
          <button
            className="btn"
            type="button"
            onClick={() => {
              setEditName(deck.name)
              setEditDescription(deck.description || '')
              setEditingDeck(true)
            }}
          >
            {t('decks.editDeck')}
          </button>
        </div>
      </div>
      {error ? <div className="error">{translateError(t, error)}</div> : null}

      <section className="deck-section" aria-labelledby="deck-details-heading">
        <div className="deck-section-header">
          <h2 id="deck-details-heading" className="section-heading">
            {t('decks.detailsSection')}
          </h2>
          <button
            className="btn danger"
            type="button"
            onClick={() =>
              setConfirm({
                title: t('decks.deleteDeckTitle'),
                message: t('decks.deleteDeckMessage'),
                confirmLabel: t('decks.deleteDeckConfirm'),
                onConfirm: deleteDeck,
              })
            }
          >
            {t('common.delete')}
          </button>
        </div>
        <div className="card-form">
          <label className="group-select-label">
            {t('decks.deckGroup')}
            <select value={deck.group?.id ?? ''} onChange={changeGroup}>
              <option value="">{t('decks.noGroup')}</option>
              {groups.map((group) => (
                <option key={group.id} value={group.id}>
                  {group.name}
                </option>
              ))}
            </select>
          </label>
          <div className="lang-row">
            <LanguageSelect
              id="deck-front-language"
              label={t('decks.frontLanguage')}
              value={frontLanguage}
              onChange={(value) => changeLanguage('frontLanguage', value)}
            />
            <LanguageSelect
              id="deck-back-language"
              label={t('decks.backLanguage')}
              value={backLanguage}
              onChange={(value) => changeLanguage('backLanguage', value)}
            />
          </div>
        </div>
      </section>

      <section className="deck-section" aria-labelledby="deck-cards-heading">
        <div className="deck-section-header">
          <h2 id="deck-cards-heading" className="section-heading">
            {t('decks.cardsSection')}
          </h2>
          <div className="header-actions">
            <button className="btn primary" type="button" onClick={openAddCard}>
              {t('decks.addCard')}
            </button>
            <button className="btn" type="button" onClick={() => fileRef.current?.click()}>
              {t('decks.importCsv')}
            </button>
            <button className="btn" type="button" onClick={exportCsv}>
              {t('decks.exportCsv')}
            </button>
            <input ref={fileRef} type="file" accept=".csv,text/csv" hidden onChange={importCsv} />
          </div>
        </div>
        {cards.length === 0 ? (
          <div className="empty">{t('decks.emptyCards')}</div>
        ) : (
          <>
            <p className="muted">{t('decks.reorderHint')}</p>
            <ul className="card-list">
              {cards.map((card, index) => (
                <li
                  key={card.id}
                  className="card-row"
                  onDragOver={onDragOver}
                  onDrop={(event) => onDrop(event, index)}
                >
                  <div className="reorder-controls">
                    <span
                      className="drag-handle"
                      draggable
                      aria-hidden="true"
                      onDragStart={(event) => onDragStart(event, index)}
                    >
                      <GripIcon />
                    </span>
                    <button
                      className="btn ghost icon-btn"
                      type="button"
                      aria-label={t('decks.moveUp')}
                      disabled={index === 0}
                      onClick={() => moveCard(index, index - 1)}
                    >
                      ↑
                    </button>
                    <button
                      className="btn ghost icon-btn"
                      type="button"
                      aria-label={t('decks.moveDown')}
                      disabled={index === cards.length - 1}
                      onClick={() => moveCard(index, index + 1)}
                    >
                      ↓
                    </button>
                  </div>
                  <div className="card-row-body">
                    <div className="card-side-line">
                      <strong>{card.front}</strong>
                      <SpeakButton text={card.front} lang={frontLanguage} />
                    </div>
                    <p className="muted card-side-line">
                      <span>{card.back}</span>
                      <SpeakButton text={card.back} lang={backLanguage} />
                    </p>
                    {card.hint ? (
                      <p className="muted small">
                        {t('decks.hint')}: {card.hint}
                      </p>
                    ) : null}
                  </div>
                  <div className="header-actions">
                    <button
                      className="btn ghost"
                      type="button"
                      onClick={() => openEditCard(card)}
                    >
                      {t('common.edit')}
                    </button>
                    <button
                      className="btn ghost"
                      type="button"
                      onClick={() =>
                        setConfirm({
                          title: t('decks.deleteCardTitle'),
                          message: t('decks.deleteCardMessage'),
                          confirmLabel: t('decks.deleteCardConfirm'),
                          onConfirm: () => deleteCard(card.id),
                        })
                      }
                    >
                      {t('common.delete')}
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </>
        )}
      </section>
      {cardFormOpen ? (
        <div className="modal-backdrop" onClick={closeCardForm}>
          <form
            className="modal card-edit-modal"
            onClick={(event) => event.stopPropagation()}
            onSubmit={saveCard}
          >
            <h2>{editing ? t('decks.editCardTitle') : t('decks.addCard')}</h2>
            {error ? <div className="error">{translateError(t, error)}</div> : null}
            <label>
              {t('decks.front')}
              <textarea
                value={front}
                onChange={(event) => setFront(event.target.value)}
                required
                autoFocus
              />
            </label>
            <label>
              {t('decks.back')}
              <textarea value={back} onChange={(event) => setBack(event.target.value)} required />
            </label>
            <label>
              {t('decks.hint')}
              <textarea
                value={hint}
                placeholder={t('decks.hintPlaceholder')}
                onChange={(event) => setHint(event.target.value)}
              />
            </label>
            <div className="header-actions">
              <button className="btn primary" type="submit" disabled={busy}>
                {editing ? t('decks.saveCard') : t('decks.addCard')}
              </button>
              <button className="btn ghost" type="button" disabled={busy} onClick={closeCardForm}>
                {t('common.cancel')}
              </button>
            </div>
          </form>
        </div>
      ) : null}
      {editingDeck ? (
        <div className="modal-backdrop" onClick={() => setEditingDeck(false)}>
          <form className="modal" onClick={(event) => event.stopPropagation()} onSubmit={saveDeckDetails}>
            <h2>{t('decks.editDeckTitle')}</h2>
            <label>
              {t('decks.deckName')}
              <input value={editName} onChange={(event) => setEditName(event.target.value)} required autoFocus />
            </label>
            <label>
              {t('decks.description')}
              <textarea
                value={editDescription}
                maxLength={2000}
                onChange={(event) => setEditDescription(event.target.value)}
              />
            </label>
            <div className="header-actions">
              <button className="btn primary" type="submit">
                {t('common.save')}
              </button>
              <button className="btn ghost" type="button" onClick={() => setEditingDeck(false)}>
                {t('common.cancel')}
              </button>
            </div>
          </form>
        </div>
      ) : null}
      {studyOpen ? (
        <StudyModeModal
          hardCount={deck.hardCount || 0}
          onSelect={(mode, filter) => {
            setStudyOpen(false)
            const path = `/decks/${id}/study/${mode}`
            navigate(filter === 'hard' ? `${path}?filter=hard` : path)
          }}
          onCancel={() => setStudyOpen(false)}
        />
      ) : null}
      {confirm ? (
        <ConfirmModal
          title={confirm.title}
          message={confirm.message}
          confirmLabel={confirm.confirmLabel}
          danger
          onConfirm={confirm.onConfirm}
          onCancel={() => setConfirm(null)}
        />
      ) : null}
    </div>
  )
}

function GripIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <path
        d="M3 5h12M3 9h12M3 13h12"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
    </svg>
  )
}
