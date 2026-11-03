import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { api } from '../api'
import { useAuth } from '../AuthContext'
import { isProLicensed } from '../pro'
import { useTrackProGate } from '../analytics'
import { useResumeExpiredSubscription } from '../useResumeExpiredSubscription'
import { translateError } from '../i18n/errors'
import { formatDate } from '../i18n/format'
import { sortDecks } from '../deckSort'
import { MIX_STUDY_ORDERS, normalizeMixStudyOrder } from '../studySettings'
import { withMixReturn } from '../mixReturn'
import MenuIcon from './MenuIcon'
import StudyModeModal from './StudyModeModal'
import { GroupBadge } from './ColorPicker'

const PAGE_SIZE = 6

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
  useTrackProGate('mixes', Boolean(user) && !pro)
  const mixPath = `/mixes/${id}`

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
    navigate(`/listen?source=mix&id=${id}`, { state: { listenReturn: mixPath } })
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
  const selectedSets = new Set((mix.setIds || []).map(String))
  const selectedDecks = new Set((mix.deckIds || []).map(String))
  const memberSets = mix.includeAll ? groups : groups.filter((group) => selectedSets.has(String(group.id)))
  const memberDecks = sortDecks(
    mix.includeAll ? decks : decks.filter((deck) => selectedDecks.has(String(deck.id))),
    user?.deckSort,
  )
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
          {mix.includeAll ? <p className="muted">{t('mix.summaryAll')}</p> : null}
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
          <button className="btn with-icon deck-action-edit" type="button" onClick={() => navigate(`${mixPath}/edit`)}>
            <MenuIcon name="edit" />
            <span>{t('mix.edit')}</span>
          </button>
        </div>
      </div>
      {error ? <div className="error">{translateError(t, error)}</div> : null}
      {mix.includeAll ? <p className="muted">{t('mix.includeAllHint')}</p> : null}

      <MixSources key={id} sets={memberSets} decks={memberDecks} mixPath={mixPath} />

      {memberSets.length === 0 && memberDecks.length === 0 ? <p className="muted">{t('mix.noCards')}</p> : null}

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

function MixSources({ sets, decks, mixPath }) {
  const { t } = useTranslation()
  const [setPage, setSetPage] = useState(1)
  const [deckPage, setDeckPage] = useState(1)

  return (
    <>
      {sets.length > 0 ? (
        <section className="deck-section mix-source">
          <h2 className="section-heading">{t('mix.sets')}</h2>
          <div className="deck-grid">
            {pageItems(sets, setPage).map((group) => (
              <div key={group.id} className="deck-card">
                <Link className="deck-card-main" to={withMixReturn(`/sets/${group.id}`, mixPath)}>
                  <div className="deck-card-lead">
                    <GroupBadge group={group} />
                  </div>
                  <h2 title={group.name}>{group.name}</h2>
                  <p className="muted">{t('groups.decks', { count: group.deckCount })}</p>
                </Link>
              </div>
            ))}
          </div>
          <CardPager page={setPage} total={sets.length} onPage={setSetPage} />
        </section>
      ) : null}
      {decks.length > 0 ? (
        <section className="deck-section mix-source">
          <h2 className="section-heading">{t('groups.decks', { count: decks.length })}</h2>
          <div className="deck-grid">
            {pageItems(decks, deckPage).map((deck) => (
              <div key={deck.id} className="deck-card">
                <Link className="deck-card-main" to={withMixReturn(`/decks/${deck.id}`, mixPath)}>
                  {deck.group ? (
                    <div className="deck-card-lead">
                      <GroupBadge group={deck.group} />
                    </div>
                  ) : null}
                  <h2 className={deck.group ? undefined : 'deck-card-title'} title={deck.name}>
                    {deck.name}
                  </h2>
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
          <CardPager page={deckPage} total={decks.length} onPage={setDeckPage} />
        </section>
      ) : null}
    </>
  )
}

function pageItems(items, page) {
  const totalPages = Math.max(1, Math.ceil(items.length / PAGE_SIZE))
  const safe = Math.min(Math.max(page, 1), totalPages)
  const start = (safe - 1) * PAGE_SIZE
  return items.slice(start, start + PAGE_SIZE)
}

function CardPager({ page, total, onPage }) {
  const { t } = useTranslation()
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const safe = Math.min(Math.max(page, 1), totalPages)
  if (total <= PAGE_SIZE) {
    return null
  }
  return (
    <div className="library-pager">
      {safe > 1 ? (
        <button className="btn" type="button" onClick={() => onPage(safe - 1)}>
          {t('listen.previous')}
        </button>
      ) : null}
      <p className="muted">{t('listen.pageStatus', { page: safe, total: totalPages })}</p>
      {safe < totalPages ? (
        <button className="btn" type="button" onClick={() => onPage(safe + 1)}>
          {t('listen.next')}
        </button>
      ) : null}
    </div>
  )
}
