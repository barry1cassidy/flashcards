import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { api } from '../api'
import { useAuth } from '../AuthContext'
import { isProLicensed } from '../pro'
import { useResumeExpiredSubscription } from '../useResumeExpiredSubscription'
import { translateError } from '../i18n/errors'
import { MIX_STUDY_ORDERS, normalizeMixStudyOrder } from '../studySettings'
import MenuIcon from './MenuIcon'
import StudyModeModal from './StudyModeModal'
import { GroupBadge } from './ColorPicker'

export default function MixDetailPage() {
  const { t } = useTranslation()
  const { id } = useParams()
  const { user } = useAuth()
  useResumeExpiredSubscription()
  const navigate = useNavigate()
  const [mix, setMix] = useState(null)
  const [groups, setGroups] = useState([])
  const [decks, setDecks] = useState([])
  const [error, setError] = useState('')
  const [studyOpen, setStudyOpen] = useState(false)
  const pro = isProLicensed(user)

  useEffect(() => {
    if (!pro) {
      return undefined
    }
    let cancelled = false
    Promise.all([api(`/api/mixes/${id}`), api('/api/groups'), api('/api/decks')])
      .then(([mixData, groupData, deckData]) => {
        if (cancelled) {
          return
        }
        setMix(mixData)
        setGroups(groupData)
        setDecks(deckData)
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err.message)
        }
      })
    return () => {
      cancelled = true
    }
  }, [id, pro])

  function listen() {
    navigate(`/listen?source=mix&id=${id}`, { state: { listenReturn: `/mixes/${id}` } })
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
          <Link className="btn primary" to="/pro">
            {t('pro.goToPro')}
          </Link>
        </section>
      </div>
    )
  }

  if (!mix) {
    return (
      <div className="page">
        <p>{error ? translateError(t, error) : t('app.loading')}</p>
      </div>
    )
  }

  const hasCards = Number(mix.cardCount) > 0
  const setById = new Map(groups.map((group) => [String(group.id), group]))
  const deckById = new Map(decks.map((deck) => [String(deck.id), deck]))
  const memberSets = (mix.setIds || []).map((setId) => setById.get(String(setId))).filter(Boolean)
  const memberDecks = (mix.deckIds || []).map((deckId) => deckById.get(String(deckId))).filter(Boolean)
  const orderKey =
    MIX_STUDY_ORDERS.find((item) => item.value === normalizeMixStudyOrder(mix.studyOrder))?.labelKey ||
    'mix.studyOrderDefault'
  const stats = [
    t('decks.cards', { count: mix.cardCount || 0 }),
    t('decks.due', { count: mix.dueCount || 0 }),
    t('groups.decks', { count: mix.deckCount || 0 }),
  ]

  return (
    <div className="page">
      <div className="page-title">
        <div className="deck-hero">
          <Link className="page-back" to="/mixes">
            {t('mix.menu')}
          </Link>
          <h1>{mix.name}</h1>
          <p className="muted">{stats.join(' · ')}</p>
          <p className="muted">
            {mix.includeAll
              ? t('mix.summaryAll')
              : t('mix.summaryCounts', { sets: mix.setIds?.length || 0, decks: mix.deckIds?.length || 0 })}
          </p>
          <p className="muted">{t(orderKey)}</p>
        </div>
        <div className="header-actions deck-hero-actions mix-hero-actions">
          {hasCards ? (
            <button className="btn with-icon deck-action-listen" type="button" onClick={listen}>
              <MenuIcon name="listen" />
              <span>{t('listen.menu')}</span>
            </button>
          ) : null}
          {hasCards ? (
            <button className="btn primary with-icon" type="button" onClick={() => setStudyOpen(true)}>
              <MenuIcon name="study" />
              <span>{t('mix.study')}</span>
            </button>
          ) : null}
          <button className="btn with-icon deck-action-edit" type="button" onClick={() => navigate(`/mixes/${id}/edit`)}>
            <MenuIcon name="edit" />
            <span>{t('mix.edit')}</span>
          </button>
        </div>
      </div>
      {error ? <div className="error">{translateError(t, error)}</div> : null}

      <section className="deck-section">
        <h2 className="section-heading">{t('mix.contents')}</h2>
        {mix.includeAll ? <p className="muted">{t('mix.includeAllHint')}</p> : null}
        {!mix.includeAll && (memberSets.length > 0 || memberDecks.length > 0) ? (
          <ul className="card-list mix-members">
            {memberSets.map((group) => (
              <li key={`set-${group.id}`}>
                <Link className="mix-member" to={`/sets/${group.id}`}>
                  <GroupBadge group={group} />
                  <span className="muted">{t('groups.decks', { count: group.deckCount })}</span>
                </Link>
              </li>
            ))}
            {memberDecks.map((deck) => (
              <li key={`deck-${deck.id}`}>
                <Link className="mix-member" to={`/decks/${deck.id}`}>
                  <strong>{deck.name}</strong>
                </Link>
              </li>
            ))}
          </ul>
        ) : null}
        {!hasCards ? <p className="muted">{t('mix.noCards')}</p> : null}
      </section>

      {studyOpen ? (
        <StudyModeModal
          hardCount={mix.hardCount || 0}
          againCount={mix.againCount || 0}
          onSelect={(mode, filter) => {
            const path = `/mixes/${id}/study/${mode}`
            setStudyOpen(false)
            navigate(filter === 'hard' || filter === 'again' ? `${path}?filter=${filter}` : path)
          }}
          onCancel={() => setStudyOpen(false)}
        />
      ) : null}
    </div>
  )
}
