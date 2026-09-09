import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { api } from '../api'
import { useAuth } from '../AuthContext'
import { isProLicensed } from '../pro'
import { translateError } from '../i18n/errors'
import ConfirmModal from './ConfirmModal'
import { GroupBadge } from './ColorPicker'

export default function MixEditorPage() {
  const { t } = useTranslation()
  const { id } = useParams()
  const isNew = !id
  const { user } = useAuth()
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [includeAll, setIncludeAll] = useState(false)
  const [setIds, setSetIds] = useState(() => new Set())
  const [deckIds, setDeckIds] = useState(() => new Set())
  const [openSets, setOpenSets] = useState(() => new Set())
  const [groups, setGroups] = useState([])
  const [decks, setDecks] = useState([])
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const pro = isProLicensed(user)

  useEffect(() => {
    if (!pro) {
      return
    }
    const load = async () => {
      const [groupData, deckData] = await Promise.all([api('/api/groups'), api('/api/decks')])
      setGroups(groupData)
      setDecks(deckData)
      if (!isNew) {
        const mix = await api(`/api/mixes/${id}`)
        setName(mix.name || '')
        setIncludeAll(Boolean(mix.includeAll))
        setSetIds(new Set((mix.setIds || []).map(String)))
        setDeckIds(new Set((mix.deckIds || []).map(String)))
      }
    }
    load().catch((err) => setError(err.message))
  }, [id, isNew, pro])

  const ungrouped = useMemo(() => decks.filter((deck) => !deck.group), [decks])
  const decksBySet = useMemo(() => {
    const map = new Map()
    for (const deck of decks) {
      if (!deck.group) {
        continue
      }
      const key = String(deck.group.id)
      if (!map.has(key)) {
        map.set(key, [])
      }
      map.get(key).push(deck)
    }
    return map
  }, [decks])

  function toggleSet(setId) {
    const key = String(setId)
    const next = new Set(setIds)
    if (next.has(key)) {
      next.delete(key)
    } else {
      next.add(key)
      const nextDecks = new Set(deckIds)
      for (const deck of decksBySet.get(key) || []) {
        nextDecks.delete(String(deck.id))
      }
      setDeckIds(nextDecks)
    }
    setSetIds(next)
  }

  function toggleDeck(deckId, setId) {
    if (setId && setIds.has(String(setId))) {
      return
    }
    const key = String(deckId)
    const next = new Set(deckIds)
    if (next.has(key)) {
      next.delete(key)
    } else {
      next.add(key)
    }
    setDeckIds(next)
  }

  function toggleOpen(setId) {
    const key = String(setId)
    const next = new Set(openSets)
    if (next.has(key)) {
      next.delete(key)
    } else {
      next.add(key)
    }
    setOpenSets(next)
  }

  async function save(event) {
    event.preventDefault()
    setError('')
    setBusy(true)
    try {
      const body = {
        name,
        includeAll,
        setIds: includeAll ? [] : [...setIds],
        deckIds: includeAll ? [] : [...deckIds],
      }
      if (isNew) {
        await api('/api/mixes', { method: 'POST', body: JSON.stringify(body) })
        navigate('/mixes')
        return
      }
      await api(`/api/mixes/${id}`, { method: 'PUT', body: JSON.stringify(body) })
      navigate('/mixes')
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  async function remove() {
    setBusy(true)
    try {
      await api(`/api/mixes/${id}`, { method: 'DELETE' })
      navigate('/mixes')
    } catch (err) {
      setError(err.message)
      setBusy(false)
    }
  }

  if (!pro) {
    return (
      <div className="page">
        <div className="page-title">
          <div>
            <Link className="page-back" to="/mixes">
              {t('mix.menu')}
            </Link>
            <h1>{t('mix.menu')}</h1>
          </div>
        </div>
        <section className="card-form">
          <p>{t('mix.proRequired')}</p>
          <Link className="btn primary" to="/settings">
            {t('agent.goToSettings')}
          </Link>
        </section>
      </div>
    )
  }

  const canSave = name.trim() && (includeAll || setIds.size > 0 || deckIds.size > 0)

  return (
    <div className="page">
      <div className="page-title">
        <div>
          <Link className="page-back" to="/mixes">
            {t('mix.menu')}
          </Link>
          <h1>{isNew ? t('mix.new') : t('mix.edit')}</h1>
          <p className="muted">{t('mix.editorHint')}</p>
        </div>
      </div>
      {error ? <div className="error">{translateError(t, error)}</div> : null}
      <form className="card-form" onSubmit={save}>
        <label>
          {t('mix.name')}
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            required
            maxLength={80}
            autoFocus={isNew}
            disabled={busy}
          />
        </label>
        <label className="mix-pick">
          <input
            type="checkbox"
            checked={includeAll}
            onChange={(event) => setIncludeAll(event.target.checked)}
            disabled={busy}
          />
          <span>
            <strong>{t('mix.includeAll')}</strong>
            <span className="muted"> {t('mix.includeAllHint')}</span>
          </span>
        </label>

        <div className={`mix-sources${includeAll ? ' is-disabled' : ''}`}>
          <h2>{t('mix.sets')}</h2>
          {groups.length === 0 ? <p className="muted">{t('mix.noSets')}</p> : null}
          {groups.map((group) => {
            const key = String(group.id)
            const open = openSets.has(key)
            const setChecked = setIds.has(key)
            const setDecks = decksBySet.get(key) || []
            return (
              <section key={group.id} className="mix-set">
                <div className="mix-set-row">
                  <label className="mix-pick">
                    <input
                      type="checkbox"
                      checked={setChecked}
                      onChange={() => toggleSet(group.id)}
                      disabled={busy || includeAll}
                    />
                    <GroupBadge group={group} />
                    <span>
                      <strong>{group.name}</strong>
                      <span className="muted"> {t('groups.decks', { count: group.deckCount })}</span>
                    </span>
                  </label>
                  {setDecks.length > 0 ? (
                    <button
                      className="btn ghost mix-set-toggle"
                      type="button"
                      onClick={() => toggleOpen(group.id)}
                      disabled={busy || includeAll}
                    >
                      {open ? t('mix.hideDecks') : t('mix.showDecks')}
                    </button>
                  ) : null}
                </div>
                {open ? (
                  <div className="mix-decks">
                    {setDecks.map((deck) => (
                      <label key={deck.id} className="mix-pick mix-pick-nested">
                        <input
                          type="checkbox"
                          checked={setChecked || deckIds.has(String(deck.id))}
                          onChange={() => toggleDeck(deck.id, group.id)}
                          disabled={busy || includeAll || setChecked}
                        />
                        <span>{deck.name}</span>
                      </label>
                    ))}
                  </div>
                ) : null}
              </section>
            )
          })}

          <h2>{t('mix.ungrouped')}</h2>
          {ungrouped.length === 0 ? <p className="muted">{t('mix.noUngrouped')}</p> : null}
          {ungrouped.map((deck) => (
            <label key={deck.id} className="mix-pick">
              <input
                type="checkbox"
                checked={deckIds.has(String(deck.id))}
                onChange={() => toggleDeck(deck.id, null)}
                disabled={busy || includeAll}
              />
              <span>{deck.name}</span>
            </label>
          ))}
        </div>

        <div className="header-actions">
          <button className="btn primary" type="submit" disabled={busy || !canSave}>
            {t('common.save')}
          </button>
          <Link className="btn ghost" to="/mixes">
            {t('common.cancel')}
          </Link>
          {!isNew ? (
            <button className="btn danger" type="button" disabled={busy} onClick={() => setConfirmDelete(true)}>
              {t('common.delete')}
            </button>
          ) : null}
        </div>
      </form>
      {confirmDelete ? (
        <ConfirmModal
          title={t('mix.deleteTitle')}
          message={t('mix.deleteMessage')}
          confirmLabel={t('common.delete')}
          danger
          onConfirm={remove}
          onCancel={() => setConfirmDelete(false)}
        />
      ) : null}
    </div>
  )
}
