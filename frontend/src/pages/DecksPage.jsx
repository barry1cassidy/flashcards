import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { api } from '../api'
import { formatDate } from '../i18n/format'
import { translateError } from '../i18n/errors'
import { GroupBadge } from './ColorPicker'
import ConfirmModal from './ConfirmModal'
import Modal from './Modal'
import ShareModal from './ShareModal'
import ListingActions from './ListingActions'
import DeckWelcome from './DeckWelcome'
import { useAuth } from '../AuthContext'
import { isAdmin } from '../admin'
import { sortDecks } from '../deckSort'
import { shareCodeFromInput } from '../shareCode'
import { defaultSpeechLanguage } from '../speechLanguages'
import LanguageSelect from './LanguageSelect'

const GROUP_FILTER_KEY = 'flashcards.deckGroupFilter'

function ShareCodeToggle({ open, onToggle, label }) {
  return (
    <button
      className="btn ghost deck-share-toggle"
      type="button"
      aria-expanded={open}
      onClick={onToggle}
    >
      {label}
    </button>
  )
}

function readGroupFilter() {
  try {
    return localStorage.getItem(GROUP_FILTER_KEY) || ''
  } catch {
    return ''
  }
}

function writeGroupFilter(value) {
  try {
    if (value) {
      localStorage.setItem(GROUP_FILTER_KEY, value)
    } else {
      localStorage.removeItem(GROUP_FILTER_KEY)
    }
  } catch {
    // localStorage can be unavailable in some WebViews
  }
}

export default function DecksPage() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const [decks, setDecks] = useState([])
  const [loaded, setLoaded] = useState(false)
  const [groups, setGroups] = useState([])
  const [groupFilter, setGroupFilter] = useState(readGroupFilter)
  const [creating, setCreating] = useState(false)
  const [name, setName] = useState('')
  const nameRef = useRef(null)
  const [description, setDescription] = useState('')
  const [frontLanguage, setFrontLanguage] = useState('en-US')
  const [backLanguage, setBackLanguage] = useState('en-US')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [shareTarget, setShareTarget] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [shareInput, setShareInput] = useState('')
  const [shareError, setShareError] = useState('')
  const [shareBusy, setShareBusy] = useState(false)
  const [shareOpen, setShareOpen] = useState(false)
  const [deckQuery, setDeckQuery] = useState('')
  const shareCode = shareCodeFromInput(shareInput)

  async function load() {
    const [deckData, groupData] = await Promise.all([api('/api/decks'), api('/api/groups')])
    setDecks(deckData)
    setGroups(groupData)
    setGroupFilter((current) => {
      if (!current || groupData.some((group) => String(group.id) === current)) {
        return current
      }
      writeGroupFilter('')
      return ''
    })
  }

  useEffect(() => {
    load()
      .catch((err) => setError(err.message))
      .finally(() => setLoaded(true))
  }, [])

  useEffect(() => {
    if (searchParams.get('create') !== '1') {
      return
    }
    setError('')
    const language = defaultSpeechLanguage(user?.locale)
    setFrontLanguage(language)
    setBackLanguage(language)
    setCreating(true)
    const next = new URLSearchParams(searchParams)
    next.delete('create')
    setSearchParams(next, { replace: true })
  }, [searchParams, setSearchParams, user?.locale])

  function onGroupFilterChange(value) {
    setGroupFilter(value)
    writeGroupFilter(value)
  }

  function closeCreate() {
    if (busy) {
      return
    }
    setCreating(false)
    setName('')
    setDescription('')
    setError('')
  }

  async function deleteDeck() {
    const deck = deleteTarget
    setDeleteTarget(null)
    setError('')
    try {
      await api(`/api/decks/${deck.id}`, { method: 'DELETE' })
      await load()
    } catch (err) {
      setError(err.message)
    }
  }

  async function addSharedDeck(event) {
    event.preventDefault()
    if (!shareCode || shareBusy) {
      return
    }
    setShareError('')
    setShareBusy(true)
    try {
      const result = await api(`/api/shares/${encodeURIComponent(shareCode)}/copy`, { method: 'POST' })
      setShareInput('')
      if (result?.kind === 'SET' && result.groupId) {
        navigate(`/sets/${result.groupId}`)
        return
      }
      if (result?.deckId) {
        navigate(`/decks/${result.deckId}`)
      }
    } catch (err) {
      setShareError(err.message)
    } finally {
      setShareBusy(false)
    }
  }

  async function createDeck(event) {
    event.preventDefault()
    if (!name.trim()) {
      nameRef.current?.focus()
      return
    }
    setError('')
    setBusy(true)
    try {
      const filteredGroup = decks.length > 0
        ? groups.find((group) => String(group.id) === groupFilter)
        : null
      const deck = await api('/api/decks', {
        method: 'POST',
        body: JSON.stringify({
          name,
          description,
          groupId: filteredGroup ? filteredGroup.id : null,
          frontLanguage,
          backLanguage,
        }),
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

  const deckQueryText = deckQuery.trim().toLowerCase()
  const visibleDecks = sortDecks(
    decks.filter((deck) => {
      if (groupFilter && String(deck.group?.id) !== groupFilter) {
        return false
      }
      if (!deckQueryText) {
        return true
      }
      const haystack = `${deck.name} ${deck.description || ''} ${deck.group?.name || ''}`.toLowerCase()
      return haystack.includes(deckQueryText)
    }),
    user?.deckSort,
  )
  const showWelcome = loaded && !error && decks.length === 0
  const showDecks = loaded && !error && decks.length > 0

  function openCreate() {
    setError('')
    const language = defaultSpeechLanguage(user?.locale)
    setFrontLanguage(language)
    setBackLanguage(language)
    setCreating(true)
  }

  const shareForm = (
    <form className="deck-share-add" onSubmit={addSharedDeck}>
      <label>
        <span>{t('decks.addShare')}</span>
        <span className="muted">{t('decks.addShareHint')}</span>
      </label>
      <div className="create-row">
        <input
          value={shareInput}
          onChange={(event) => {
            setShareInput(event.target.value)
            setShareError('')
          }}
          maxLength={200}
          autoCapitalize="characters"
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
          placeholder={t('decks.addSharePlaceholder')}
          aria-label={t('decks.addSharePlaceholder')}
          className="deck-share-input"
          autoFocus={shareOpen}
        />
        <button className="btn" type="submit" disabled={shareBusy || !shareCode}>
          {shareBusy ? t('share.copying') : t('decks.addShareButton')}
        </button>
      </div>
      {shareError ? <div className="error">{translateError(t, shareError)}</div> : null}
    </form>
  )

  return (
    <div className="page">
      {!showWelcome ? (
        <div className="page-title">
          <div>
            <h1>{t('decks.title')}</h1>
            {loaded ? <p className="muted">{t('decks.subtitle')}</p> : null}
          </div>
          {isAdmin(user) || loaded ? (
            <div className="page-title-actions">
              {isAdmin(user) ? (
                <button className="btn" type="button" onClick={() => navigate('/create-with-ai')}>
                  {t('agent.menu')}
                </button>
              ) : null}
              {loaded ? (
                <button className="btn primary" type="button" onClick={openCreate}>
                  {t('decks.createDeck')}
                </button>
              ) : null}
            </div>
          ) : null}
        </div>
      ) : isAdmin(user) ? (
        <div className="page-title">
          <div className="page-title-actions">
            <button className="btn" type="button" onClick={() => navigate('/create-with-ai')}>
              {t('agent.menu')}
            </button>
          </div>
        </div>
      ) : null}
      {!loaded && !error ? <p className="muted">{t('app.loading')}</p> : null}
      {error && !creating ? <div className="error">{translateError(t, error)}</div> : null}
      {showWelcome ? (
        <DeckWelcome
          onCreate={openCreate}
          shareOpen={shareOpen}
          onShowShare={() => setShareOpen(true)}
          shareForm={shareForm}
        />
      ) : null}
      {loaded && !showWelcome && !showDecks ? (
        <div className="deck-toolbar">
          <ShareCodeToggle open={shareOpen} onToggle={() => setShareOpen((open) => !open)} label={t('decks.welcomeShare')} />
          {shareOpen ? shareForm : null}
        </div>
      ) : null}
      {showDecks ? (
        <>
          <div className="deck-toolbar">
            <input
              type="search"
              className="deck-search"
              value={deckQuery}
              onChange={(event) => setDeckQuery(event.target.value)}
              placeholder={t('decks.searchPlaceholder')}
              aria-label={t('decks.searchPlaceholder')}
              autoComplete="off"
              enterKeyHint="search"
            />
            <div className="deck-toolbar-row">
              {groups.length > 0 ? (
                <label className="deck-filter">
                  {t('decks.filterGroup')}
                  <select
                    value={groupFilter}
                    onChange={(event) => onGroupFilterChange(event.target.value)}
                  >
                    <option value="">{t('decks.allGroups')}</option>
                    {groups.map((group) => (
                      <option key={group.id} value={String(group.id)}>
                        {group.name}
                      </option>
                    ))}
                  </select>
                </label>
              ) : null}
              <ShareCodeToggle open={shareOpen} onToggle={() => setShareOpen((open) => !open)} label={t('decks.welcomeShare')} />
            </div>
            {shareOpen ? shareForm : null}
          </div>
          {visibleDecks.length === 0 ? (
            <div className="empty">{deckQueryText ? t('decks.searchEmpty') : t('decks.emptyFiltered')}</div>
          ) : (
            <div className="deck-grid">
              {visibleDecks.map((deck) => (
                <div key={deck.id} className="deck-card">
                  <ListingActions
                    name={deck.name}
                    onShare={() => setShareTarget(deck)}
                    onDelete={() => setDeleteTarget(deck)}
                  />
                  <Link to={`/decks/${deck.id}`} className="deck-card-main">
                    {deck.group ? (
                      <div className="deck-card-lead">
                        <GroupBadge group={deck.group} />
                      </div>
                    ) : null}
                    <h2 className={deck.group ? undefined : 'deck-card-title'} title={deck.name}>{deck.name}</h2>
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
                </div>
              ))}
            </div>
          )}
        </>
      ) : null}
      {shareTarget ? (
        <ShareModal
          kind="DECK"
          targetId={shareTarget.id}
          name={shareTarget.name}
          onClose={() => setShareTarget(null)}
        />
      ) : null}
      {deleteTarget ? (
        <ConfirmModal
          title={t('decks.deleteDeckTitle')}
          message={t('decks.deleteDeckMessage')}
          confirmLabel={t('decks.deleteDeckConfirm')}
          danger
          onConfirm={deleteDeck}
          onCancel={() => setDeleteTarget(null)}
        />
      ) : null}
      {creating ? (
        <Modal
          variant="form"
          as="form"
          title={t('decks.createDeckTitle')}
          onClose={closeCreate}
          closeDisabled={busy}
          noValidate
          onSubmit={createDeck}
          footer={
            <div className="modal-actions">
              <button className="btn primary" type="submit" disabled={busy}>
                {busy ? t('common.saving') : t('decks.createDeck')}
              </button>
              <button className="btn ghost" type="button" onClick={closeCreate} disabled={busy}>
                {t('common.cancel')}
              </button>
            </div>
          }
        >
          {error ? <div className="error">{translateError(t, error)}</div> : null}
          <label>
            {t('decks.deckName')}
            <input ref={nameRef} value={name} onChange={(event) => setName(event.target.value)} required />
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
          <div className="lang-row">
            <LanguageSelect
              id="create-front-language"
              label={t('decks.frontLanguage')}
              value={frontLanguage}
              disabled={busy}
              onChange={setFrontLanguage}
            />
            <LanguageSelect
              id="create-back-language"
              label={t('decks.backLanguage')}
              value={backLanguage}
              disabled={busy}
              onChange={setBackLanguage}
            />
          </div>
        </Modal>
      ) : null}
    </div>
  )
}
