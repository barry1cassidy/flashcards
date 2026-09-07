import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { api } from '../api'
import { PRESET_COLORS } from '../colors'
import { translateError } from '../i18n/errors'
import { GroupBadge } from './ColorPicker'
import GroupForm from './GroupForm'

export default function GroupsPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const [groups, setGroups] = useState([])
  const [error, setError] = useState('')
  const creating = searchParams.get('new') === '1'

  async function load() {
    setGroups(await api('/api/groups'))
  }

  useEffect(() => {
    load().catch((err) => setError(err.message))
  }, [])

  async function createGroup({ name, color }) {
    const group = await api('/api/groups', {
      method: 'POST',
      body: JSON.stringify({ name, color }),
    })
    setSearchParams({})
    navigate(`/sets/${group.id}`)
  }

  return (
    <div className="page">
      <div className="page-title">
        <div>
          <h1>{t('groups.title')}</h1>
          <p className="muted">{t('groups.pageSubtitle')}</p>
        </div>
        <button className="btn primary" type="button" onClick={() => setSearchParams({ new: '1' })}>
          {t('groups.newGroup')}
        </button>
      </div>
      {error ? <div className="error">{translateError(t, error)}</div> : null}
      {groups.length === 0 ? (
        <div className="empty">{t('groups.emptyList')}</div>
      ) : (
        <div className="deck-grid">
          {groups.map((group) => (
            <Link key={group.id} to={`/sets/${group.id}`} className="deck-card">
              <GroupBadge group={group} />
              <h2>{group.name}</h2>
              <p className="muted">{t('groups.decks', { count: group.deckCount })}</p>
            </Link>
          ))}
        </div>
      )}
      {creating ? (
        <div className="modal-backdrop" onClick={() => setSearchParams({})}>
          <div className="modal" onClick={(event) => event.stopPropagation()}>
            <h2>{t('groups.newTitle')}</h2>
            <p className="muted">{t('groups.newSubtitle')}</p>
            <GroupForm
              initialColor={PRESET_COLORS[0]}
              submitLabel={t('groups.createGroup')}
              onSubmit={createGroup}
              onCancel={() => setSearchParams({})}
            />
          </div>
        </div>
      ) : null}
    </div>
  )
}
