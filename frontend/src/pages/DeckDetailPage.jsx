import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { api } from '../api'
import { downloadBlob, csvFilename } from '../download'
import { formatDate } from '../i18n/format'
import { translateError } from '../i18n/errors'
import { SPEECH_LANGUAGES, normalizeSpeechLanguage } from '../speechLanguages'
import ConfirmModal from './ConfirmModal'
import ShareModal from './ShareModal'
import MenuIcon from './MenuIcon'
import StudyModeModal from './StudyModeModal'
import { GroupBadge } from './ColorPicker'
import LanguageSelect from './LanguageSelect'
import SpeakButton from './SpeakButton'
import CardImageField from './CardImageField'
import AuthImage from './AuthImage'
import { useAuth } from '../AuthContext'
import { isProLicensed } from '../pro'
import { getOfflinePack, saveOfflinePack } from '../offlinePacks'
import { useResumeExpiredSubscription } from '../useResumeExpiredSubscription'

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
  const { user } = useAuth()
  useResumeExpiredSubscription()
  const pro = isProLicensed(user)
  const { id } = useParams()
  const navigate = useNavigate()
  const fileRef = useRef(null)
  const listRef = useRef(null)
  const cardsRef = useRef([])
  const deckRef = useRef(null)
  const deckSave = useRef(Promise.resolve())
  const drag = useRef(null)
  const [deck, setDeck] = useState(null)
  const [cards, setCards] = useState([])
  const [draggingId, setDraggingId] = useState(null)
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
  const [editGroupId, setEditGroupId] = useState('')
  const [editFrontLanguage, setEditFrontLanguage] = useState('en-US')
  const [editBackLanguage, setEditBackLanguage] = useState('en-US')
  const [studyOpen, setStudyOpen] = useState(false)
  const [shareOpen, setShareOpen] = useState(false)
  const [frontFile, setFrontFile] = useState(null)
  const [backFile, setBackFile] = useState(null)
  const [removeFrontImage, setRemoveFrontImage] = useState(false)
  const [removeBackImage, setRemoveBackImage] = useState(false)
  const [proModal, setProModal] = useState(false)
  const [offlinePack, setOfflinePack] = useState(null)
  const [offlineBusy, setOfflineBusy] = useState(false)
  const [offlineError, setOfflineError] = useState('')
  const [offlineProOpen, setOfflineProOpen] = useState(false)
  const [offlineToast, setOfflineToast] = useState('')
  const offlineToastTimer = useRef(null)
  cardsRef.current = cards
  deckRef.current = deck

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

  useEffect(() => {
    let cancelled = false
    getOfflinePack(id)
      .then((pack) => {
        if (!cancelled) {
          setOfflinePack(pack)
        }
      })
      .catch(() => {
        if (!cancelled) {
          setOfflinePack(null)
        }
      })
    return () => {
      cancelled = true
    }
  }, [id])

  useEffect(() => () => window.clearTimeout(offlineToastTimer.current), [])

  function showOfflineSaved() {
    setOfflineToast(t('offline.saved'))
    window.clearTimeout(offlineToastTimer.current)
    offlineToastTimer.current = window.setTimeout(() => setOfflineToast(''), 2000)
  }

  function downloadOffline() {
    if (!pro) {
      setOfflineProOpen(true)
      return
    }
    setOfflineError('')
    setOfflineToast('')
    window.clearTimeout(offlineToastTimer.current)
    setOfflineBusy(true)
    api(`/api/decks/${id}/offline`)
      .then(async (snapshot) => {
        const saved = await saveOfflinePack(snapshot)
        if (!saved) {
          setOfflineError(t('offline.noText'))
          return
        }
        setOfflinePack(saved)
        showOfflineSaved()
      })
      .catch((err) => setOfflineError(err.message))
      .finally(() => setOfflineBusy(false))
  }

  async function saveCard(event) {
    event.preventDefault()
    setError('')
    setBusy(true)
    try {
      const saved = editing
        ? await api(`/api/cards/${editing.id}`, {
            method: 'PUT',
            body: JSON.stringify({ front, back, hint }),
          })
        : await api(`/api/decks/${id}/cards`, {
            method: 'POST',
            body: JSON.stringify({ front, back, hint }),
          })
      await syncCardImage(saved.id, 'front', frontFile, removeFrontImage, editing?.hasFrontImage)
      await syncCardImage(saved.id, 'back', backFile, removeBackImage, editing?.hasBackImage)
      resetCardForm()
      await load()
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  async function syncCardImage(cardId, side, file, removed, hadImage) {
    if (file) {
      const body = new FormData()
      body.append('file', file)
      await api(`/api/cards/${cardId}/images/${side}`, { method: 'POST', body })
      return
    }
    if (removed && hadImage) {
      await api(`/api/cards/${cardId}/images/${side}`, { method: 'DELETE' })
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
      body: JSON.stringify(deckUpdateBody(deckRef.current, overrides)),
    })
    deckRef.current = updated
    setDeck(updated)
    return updated
  }

  function beginEdit() {
    setEditName(deck.name)
    setEditDescription(deck.description || '')
    setEditGroupId(deck.group?.id ?? '')
    setEditFrontLanguage(normalizeSpeechLanguage(deck.frontLanguage, 'en-US'))
    setEditBackLanguage(normalizeSpeechLanguage(deck.backLanguage, 'en-US'))
    setError('')
    setEditingDeck(true)
  }

  function leaveEditMode() {
    window.removeEventListener('pointermove', reorderWindow.current.onMove)
    window.removeEventListener('pointerup', reorderWindow.current.onEnd)
    window.removeEventListener('pointercancel', reorderWindow.current.onEnd)
    drag.current = null
    setDraggingId(null)
    setEditingDeck(false)
    resetCardForm()
  }

  function commitDeckDetails(overrides = {}, { exit = false } = {}) {
    const snapshot = {
      name: overrides.name ?? editName,
      description: overrides.description ?? editDescription,
      groupId: Object.hasOwn(overrides, 'groupId') ? overrides.groupId : (editGroupId || null),
      frontLanguage: overrides.frontLanguage ?? editFrontLanguage,
      backLanguage: overrides.backLanguage ?? editBackLanguage,
      exit,
    }
    const run = deckSave.current.then(() => applyDeckDetails(snapshot))
    deckSave.current = run.catch(() => {})
    return run
  }

  async function applyDeckDetails(snapshot) {
    const current = deckRef.current
    const nextName = snapshot.name.trim()
    const nextDescription = snapshot.description.trim()
    const nextGroupId = snapshot.groupId || null
    if (!nextName) {
      setEditName(current.name)
      if (snapshot.exit) {
        leaveEditMode()
      }
      return
    }
    const unchanged =
      nextName === current.name &&
      nextDescription === (current.description || '').trim() &&
      nextGroupId === (current.group?.id ?? null) &&
      snapshot.frontLanguage === normalizeSpeechLanguage(current.frontLanguage, 'en-US') &&
      snapshot.backLanguage === normalizeSpeechLanguage(current.backLanguage, 'en-US')
    if (unchanged) {
      if (snapshot.exit) {
        leaveEditMode()
      }
      return
    }
    setError('')
    setBusy(true)
    try {
      await saveDeck({
        name: nextName,
        description: nextDescription,
        groupId: nextGroupId,
        frontLanguage: snapshot.frontLanguage,
        backLanguage: snapshot.backLanguage,
      })
      setEditName(nextName)
      setEditDescription(nextDescription)
      if (snapshot.exit) {
        leaveEditMode()
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
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

  async function saveOrder(nextCards) {
    await api(`/api/decks/${id}/cards/order`, {
      method: 'PUT',
      body: JSON.stringify({ cardIds: nextCards.map((card) => card.id) }),
    })
  }

  async function persistOrder(nextCards) {
    setError('')
    try {
      await saveOrder(nextCards)
    } catch (err) {
      setError(err.message)
      await load()
    }
  }

  async function moveCard(from, to) {
    const next = moveItem(cards, from, to)
    if (next === cards) {
      return
    }
    cardsRef.current = next
    setCards(next)
    await persistOrder(next)
  }

  const reorderWindow = useRef({
    onMove(event) {
      reorderWindow.current.move(event)
    },
    onEnd(event) {
      window.removeEventListener('pointermove', reorderWindow.current.onMove)
      window.removeEventListener('pointerup', reorderWindow.current.onEnd)
      window.removeEventListener('pointercancel', reorderWindow.current.onEnd)
      reorderWindow.current.end(event)
    },
    move() {},
    end() {},
  })
  reorderWindow.current.move = (event) => {
    const state = drag.current
    if (!state || event.pointerId !== state.pointerId) {
      return
    }
    event.preventDefault()
    const edge = 48
    if (event.clientY < edge) {
      window.scrollBy(0, -16)
    } else if (event.clientY > window.innerHeight - edge) {
      window.scrollBy(0, 16)
    }
    const to = rowIndexFromPoint(listRef.current, event.clientY)
    const from = cardsRef.current.findIndex((card) => card.id === state.id)
    if (from < 0 || to < 0 || from === to) {
      return
    }
    const next = moveItem(cardsRef.current, from, to)
    cardsRef.current = next
    setCards(next)
  }
  reorderWindow.current.end = (event) => {
    const state = drag.current
    if (!state || event.pointerId !== state.pointerId) {
      return
    }
    drag.current = null
    setDraggingId(null)
    try {
      if (event.currentTarget?.hasPointerCapture?.(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId)
      }
    } catch {
      // already released
    }
    const now = cardsRef.current.findIndex((card) => card.id === state.id)
    if (now >= 0 && now !== state.fromIndex) {
      persistOrder(cardsRef.current)
    }
  }

  function onReorderPointerDown(event, index) {
    if (busy || (event.pointerType === 'mouse' && event.button !== 0)) {
      return
    }
    event.preventDefault()
    drag.current = {
      id: cards[index].id,
      fromIndex: index,
      pointerId: event.pointerId,
    }
    setDraggingId(cards[index].id)
    try {
      event.currentTarget.setPointerCapture(event.pointerId)
    } catch {
      // Some WebViews reject capture; window listeners still track the finger.
    }
    window.addEventListener('pointermove', reorderWindow.current.onMove, { passive: false })
    window.addEventListener('pointerup', reorderWindow.current.onEnd)
    window.addEventListener('pointercancel', reorderWindow.current.onEnd)
  }

  function resetCardForm() {
    setCardFormOpen(false)
    setEditing(null)
    setFront('')
    setBack('')
    setHint('')
    setFrontFile(null)
    setBackFile(null)
    setRemoveFrontImage(false)
    setRemoveBackImage(false)
  }

  function openAddCard() {
    setEditing(null)
    setFront('')
    setBack('')
    setHint('')
    setFrontFile(null)
    setBackFile(null)
    setRemoveFrontImage(false)
    setRemoveBackImage(false)
    setError('')
    setCardFormOpen(true)
  }

  function openEditCard(card) {
    setEditing(card)
    setFront(card.front)
    setBack(card.back)
    setHint(card.hint || '')
    setFrontFile(null)
    setBackFile(null)
    setRemoveFrontImage(false)
    setRemoveBackImage(false)
    setError('')
    setCardFormOpen(true)
  }

  function closeCardForm() {
    if (busy) {
      return
    }
    resetCardForm()
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
          <Link className="page-back" to="/">
            {t('decks.back')}
          </Link>
          <GroupBadge group={deck.group} />
          <h1>{deck.name}</h1>
          {deck.description ? <p>{deck.description}</p> : null}
          <p className="muted">{stats.join(' · ')}</p>
        </div>
        {editingDeck ? null : (
          <div className="header-actions">
            <button
              className={`btn ghost icon-btn offline-download-btn${offlinePack ? ' is-saved' : ''}`}
              type="button"
              disabled={offlineBusy}
              aria-pressed={Boolean(offlinePack)}
              aria-label={offlinePack ? t('offline.iconUpdate') : t('offline.iconDownload')}
              title={
                offlinePack
                  ? t('offline.savedOn', { date: formatDate(offlinePack.downloadedAt) })
                  : t('offline.iconDownload')
              }
              onClick={downloadOffline}
            >
              <MenuIcon name="offline" />
            </button>
            <button
              className="btn ghost icon-btn"
              type="button"
              onClick={() => setShareOpen(true)}
              aria-label={t('share.share')}
            >
              <MenuIcon name="share" />
            </button>
            <button className="btn primary" type="button" onClick={() => setStudyOpen(true)}>
              {t('decks.studyDeck')}
            </button>
            <button className="btn" type="button" onClick={beginEdit}>
              {t('decks.editDeck')}
            </button>
          </div>
        )}
      </div>
      {offlineError ? <div className="error">{translateError(t, offlineError)}</div> : null}
      {error ? <div className="error">{translateError(t, error)}</div> : null}

      <section className="deck-section" aria-labelledby="deck-details-heading">
        <div className="deck-section-header">
          <h2 id="deck-details-heading" className="section-heading">
            {t('decks.detailsSection')}
          </h2>
          {editingDeck ? (
            <div className="header-actions deck-detail-actions">
              <button className="btn primary" type="button" disabled={busy} onClick={() => commitDeckDetails({}, { exit: true })}>
                {t('decks.doneEditing')}
              </button>
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
                {t('decks.deleteDeckConfirm')}
              </button>
            </div>
          ) : null}
        </div>
        {editingDeck ? (
          <form id="deck-details-form" className="card-form" onSubmit={(event) => {
            event.preventDefault()
            commitDeckDetails()
          }}>
            <label>
              {t('decks.deckName')}
              <input
                value={editName}
                onChange={(event) => setEditName(event.target.value)}
                onBlur={() => commitDeckDetails()}
                required
                autoFocus
              />
            </label>
            <label>
              {t('decks.description')}
              <textarea
                value={editDescription}
                maxLength={2000}
                onChange={(event) => setEditDescription(event.target.value)}
                onBlur={() => commitDeckDetails()}
              />
            </label>
            <label className="group-select-label">
              {t('decks.deckGroup')}
              <select
                value={editGroupId}
                onChange={(event) => {
                  const groupId = event.target.value
                  setEditGroupId(groupId)
                  commitDeckDetails({ groupId: groupId || null })
                }}
              >
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
                value={editFrontLanguage}
                onChange={(value) => {
                  setEditFrontLanguage(value)
                  commitDeckDetails({ frontLanguage: value })
                }}
              />
              <LanguageSelect
                id="deck-back-language"
                label={t('decks.backLanguage')}
                value={editBackLanguage}
                onChange={(value) => {
                  setEditBackLanguage(value)
                  commitDeckDetails({ backLanguage: value })
                }}
              />
            </div>
          </form>
        ) : (
          <dl className="deck-details-read">
            <div>
              <dt>{t('decks.deckGroup')}</dt>
              <dd>{deck.group?.name || t('decks.noGroup')}</dd>
            </div>
            <div>
              <dt>{t('decks.frontLanguage')}</dt>
              <dd>{languageName(frontLanguage)}</dd>
            </div>
            <div>
              <dt>{t('decks.backLanguage')}</dt>
              <dd>{languageName(backLanguage)}</dd>
            </div>
          </dl>
        )}
      </section>

      <section className="deck-section" aria-labelledby="deck-cards-heading">
        <div className="deck-section-header">
          <h2 id="deck-cards-heading" className="section-heading">
            {t('decks.cardsSection')}
          </h2>
          <div className="header-actions deck-card-actions">
            {editingDeck ? (
              <>
                <button className="btn primary" type="button" onClick={openAddCard}>
                  {t('decks.addCard')}
                </button>
                <button className="btn" type="button" onClick={() => fileRef.current?.click()}>
                  {t('decks.importCsv')}
                </button>
              </>
            ) : null}
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
            {editingDeck ? <p className="muted">{t('decks.reorderHint')}</p> : null}
            <ul ref={listRef} className={`card-list${draggingId ? ' is-reordering' : ''}`}>
              {cards.map((card, index) => (
                <li
                  key={card.id}
                  className={`card-row${card.id === draggingId ? ' is-dragging' : ''}`}
                >
                  {editingDeck ? (
                    <div className="reorder-controls">
                      <button
                        type="button"
                        className="drag-handle"
                        aria-label={t('decks.reorderHandle')}
                        aria-pressed={card.id === draggingId}
                        onPointerDown={(event) => onReorderPointerDown(event, index)}
                      >
                        <GripIcon />
                      </button>
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
                  ) : null}
                  <div className="card-row-main">
                    <div className="card-row-body">
                    {(card.hasFrontImage || card.hasBackImage) ? (
                      <div className="card-row-thumbs">
                        {card.hasFrontImage ? (
                          <AuthImage cardId={card.id} side="front" alt="" className="card-row-thumb" />
                        ) : null}
                        {card.hasBackImage ? (
                          <AuthImage cardId={card.id} side="back" alt="" className="card-row-thumb" />
                        ) : null}
                      </div>
                    ) : null}
                      <div className="card-side-line">
                        <strong className="card-side-text">{card.front}</strong>
                        <SpeakButton text={card.front} lang={frontLanguage} />
                      </div>
                      <p className="muted card-side-line">
                        <span className="card-side-text">{card.back}</span>
                        <SpeakButton text={card.back} lang={backLanguage} />
                      </p>
                      {card.hint ? (
                        <p className="muted small card-hint">
                          {t('decks.hint')}: {card.hint}
                        </p>
                      ) : null}
                    </div>
                    {editingDeck ? (
                      <div className="card-row-actions">
                        <button className="btn ghost" type="button" onClick={() => openEditCard(card)}>
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
                    ) : null}
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
            <div className="card-side-block">
              <label>
                {t('decks.front')}
                <textarea
                  value={front}
                  onChange={(event) => setFront(event.target.value)}
                  required
                  autoFocus
                />
              </label>
              <CardImageField
                side="front"
                cardId={editing?.id}
                hasImage={Boolean(editing?.hasFrontImage)}
                file={frontFile}
                removed={removeFrontImage}
                isPro={pro}
                disabled={busy}
                onFile={(next) => {
                  setFrontFile(next)
                  setRemoveFrontImage(false)
                }}
                onRemove={() => {
                  setFrontFile(null)
                  setRemoveFrontImage(true)
                }}
                onNeedPro={() => setProModal(true)}
                onError={setError}
              />
            </div>
            <div className="card-side-block">
              <label>
                {t('decks.back')}
                <textarea value={back} onChange={(event) => setBack(event.target.value)} required />
              </label>
              <CardImageField
                side="back"
                cardId={editing?.id}
                hasImage={Boolean(editing?.hasBackImage)}
                file={backFile}
                removed={removeBackImage}
                isPro={pro}
                disabled={busy}
                onFile={(next) => {
                  setBackFile(next)
                  setRemoveBackImage(false)
                }}
                onRemove={() => {
                  setBackFile(null)
                  setRemoveBackImage(true)
                }}
                onNeedPro={() => setProModal(true)}
                onError={setError}
              />
            </div>
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
      {shareOpen ? (
        <ShareModal
          kind="DECK"
          targetId={id}
          name={deck.name}
          onClose={() => setShareOpen(false)}
        />
      ) : null}
      {offlineProOpen ? (
        <div className="modal-backdrop" onClick={() => setOfflineProOpen(false)}>
          <div
            className="modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="offline-pro-title"
            onClick={(event) => event.stopPropagation()}
          >
            <h2 id="offline-pro-title">{t('offline.proGateTitle')}</h2>
            <p>{t('offline.proGateBody')}</p>
            <div className="header-actions">
              <Link className="btn primary" to="/pro">
                {t('pro.goToPro')}
              </Link>
              <button className="btn ghost" type="button" onClick={() => setOfflineProOpen(false)}>
                {t('common.close')}
              </button>
            </div>
          </div>
        </div>
      ) : null}
      {studyOpen ? (
        <StudyModeModal
          hardCount={deck.hardCount || 0}
          againCount={deck.againCount || 0}
          onSelect={(mode, filter) => {
            setStudyOpen(false)
            const path = `/decks/${id}/study/${mode}`
            navigate(filter === 'hard' || filter === 'again' ? `${path}?filter=${filter}` : path)
          }}
          onCancel={() => setStudyOpen(false)}
        />
      ) : null}
      {proModal ? (
        <ConfirmModal
          title={t('decks.imageProTitle')}
          message={t('decks.imageProMessage')}
          confirmLabel={t('pro.goToPro')}
          onConfirm={() => navigate('/pro')}
          onCancel={() => setProModal(false)}
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
      {offlineToast ? (
        <div className="toast" role="status">
          <MenuIcon name="offline" />
          <span>{offlineToast}</span>
        </div>
      ) : null}
    </div>
  )
}

function languageName(code) {
  return SPEECH_LANGUAGES.find((language) => language.code === code)?.name || code
}

function moveItem(list, from, to) {
  if (to < 0 || to >= list.length || from === to) {
    return list
  }
  const next = [...list]
  const [item] = next.splice(from, 1)
  next.splice(to, 0, item)
  return next
}

function rowIndexFromPoint(list, clientY) {
  if (!list) {
    return -1
  }
  const rows = [...list.querySelectorAll(':scope > .card-row')]
  if (rows.length === 0) {
    return -1
  }
  for (let i = 0; i < rows.length; i++) {
    const rect = rows[i].getBoundingClientRect()
    if (clientY < rect.top + rect.height / 2) {
      return i
    }
  }
  return rows.length - 1
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
