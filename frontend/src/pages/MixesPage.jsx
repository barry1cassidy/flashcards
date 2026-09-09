import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { api } from '../api'
import { useAuth } from '../AuthContext'
import { isProLicensed } from '../pro'
import { translateError } from '../i18n/errors'
import StudyModeModal from './StudyModeModal'

export default function MixesPage() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [mixes, setMixes] = useState([])
  const [error, setError] = useState('')
  const [studyMix, setStudyMix] = useState(null)
  const pro = isProLicensed(user)

  useEffect(() => {
    if (!pro) {
      return
    }
    api('/api/mixes')
      .then(setMixes)
      .catch((err) => setError(err.message))
  }, [pro])

  return (
    <div className="page">
      <div className="page-title">
        <div>
          <h1>{t('mix.menu')}</h1>
          <p className="muted">{t('mix.subtitle')}</p>
        </div>
        {pro ? (
          <button className="btn primary" type="button" onClick={() => navigate('/mixes/new')}>
            {t('mix.new')}
          </button>
        ) : null}
      </div>
      {error ? <div className="error">{translateError(t, error)}</div> : null}

      {!pro ? (
        <section className="card-form">
          <p>{t('mix.proRequired')}</p>
          <Link className="btn primary" to="/settings">
            {t('agent.goToSettings')}
          </Link>
        </section>
      ) : null}

      {pro && mixes.length === 0 ? <div className="empty">{t('mix.empty')}</div> : null}

      {pro && mixes.length > 0 ? (
        <div className="deck-grid">
          {mixes.map((mix) => (
            <article key={mix.id} className="deck-card mix-card">
              <Link to={`/mixes/${mix.id}`} className="deck-card-main">
                <h2>{mix.name}</h2>
                <p className="muted">{summary(t, mix)}</p>
                <p className="muted">{t('mix.dueCount', { count: mix.dueCount })}</p>
              </Link>
              <div className="deck-card-actions">
                <button className="btn primary" type="button" onClick={() => setStudyMix(mix)}>
                  {t('decks.study')}
                </button>
                <Link className="btn" to={`/mixes/${mix.id}`}>
                  {t('common.edit')}
                </Link>
              </div>
            </article>
          ))}
        </div>
      ) : null}

      {studyMix ? (
        <StudyModeModal
          hardCount={studyMix.hardCount || 0}
          againCount={studyMix.againCount || 0}
          onSelect={(mode, filter) => {
            const path = `/mixes/${studyMix.id}/study/${mode}`
            setStudyMix(null)
            navigate(filter === 'hard' || filter === 'again' ? `${path}?filter=${filter}` : path)
          }}
          onCancel={() => setStudyMix(null)}
        />
      ) : null}
    </div>
  )
}

function summary(t, mix) {
  if (mix.includeAll) {
    return t('mix.summaryAll')
  }
  return t('mix.summaryCounts', { sets: mix.setIds?.length || 0, decks: mix.deckIds?.length || 0 })
}
