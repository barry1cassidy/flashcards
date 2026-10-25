import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { api } from '../api'
import { useAuth } from '../AuthContext'
import { isProLicensed } from '../pro'
import { useResumeExpiredSubscription } from '../useResumeExpiredSubscription'
import { translateError } from '../i18n/errors'
import { MIX_STUDY_ORDERS, normalizeMixStudyOrder } from '../studySettings'
import MenuIcon from './MenuIcon'
import ConfirmModal from './ConfirmModal'

export default function MixesPage() {
  const { t } = useTranslation()
  const { user } = useAuth()
  useResumeExpiredSubscription()
  const navigate = useNavigate()
  const [mixes, setMixes] = useState([])
  const [error, setError] = useState('')
  const [deleteMix, setDeleteMix] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const pro = isProLicensed(user)

  useEffect(() => {
    if (!pro) {
      return
    }
    api('/api/mixes')
      .then(setMixes)
      .catch((err) => setError(err.message))
  }, [pro])

  async function removeMix() {
    if (!deleteMix || deleting) {
      return
    }
    setDeleting(true)
    setError('')
    try {
      await api(`/api/mixes/${deleteMix.id}`, { method: 'DELETE' })
      setMixes((current) => current.filter((mix) => mix.id !== deleteMix.id))
      setDeleteMix(null)
    } catch (err) {
      setError(err.message)
      setDeleteMix(null)
    } finally {
      setDeleting(false)
    }
  }

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
          <p>{t('mix.proWhy')}</p>
          <ul className="pro-feature-list">
            <li>{t('mix.proExample1')}</li>
            <li>{t('mix.proExample2')}</li>
            <li>{t('mix.proExample3')}</li>
          </ul>
          <Link className="btn primary" to="/pro">
            {t('pro.goToPro')}
          </Link>
        </section>
      ) : null}

      {pro && mixes.length === 0 ? <div className="empty">{t('mix.empty')}</div> : null}

      {pro && mixes.length > 0 ? (
        <div className="deck-grid">
          {mixes.map((mix) => (
            <article key={mix.id} className="deck-card mix-card">
              <div className="listing-actions">
                <button
                  className="listing-action danger"
                  type="button"
                  aria-label={t('common.deleteNamed', { name: mix.name })}
                  onClick={() => setDeleteMix(mix)}
                >
                  <MenuIcon name="trash" />
                </button>
              </div>
              <Link to={`/mixes/${mix.id}`} className="deck-card-main" onClick={() => window.scrollTo(0, 0)}>
                <div className="deck-card-lead mix-card-lead">
                  <span className="mix-mark" aria-hidden="true">
                    <MenuIcon name="mix" />
                  </span>
                </div>
                <h2 title={mix.name}>{mix.name}</h2>
                <p className="muted">{summary(t, mix)}</p>
                <div className="stat-row">
                  <span>{t('decks.cards', { count: mix.cardCount || 0 })}</span>
                  <span className="due-badge">{t('decks.due', { count: mix.dueCount || 0 })}</span>
                  <span>{t('groups.decks', { count: mix.deckCount || 0 })}</span>
                </div>
              </Link>
            </article>
          ))}
        </div>
      ) : null}

      {deleteMix ? (
        <ConfirmModal
          title={t('mix.deleteTitle')}
          message={t('mix.deleteMessage')}
          confirmLabel={t('common.delete')}
          danger
          onConfirm={removeMix}
          onCancel={() => {
            if (!deleting) {
              setDeleteMix(null)
            }
          }}
        />
      ) : null}

    </div>
  )
}

function summary(t, mix) {
  const orderKey =
    MIX_STUDY_ORDERS.find((item) => item.value === normalizeMixStudyOrder(mix.studyOrder))?.labelKey ||
    'mix.studyOrderDefault'
  const order = t(orderKey)
  if (mix.includeAll) {
    return `${t('mix.summaryAll')} · ${order}`
  }
  return `${t('mix.summaryCounts', { sets: mix.setIds?.length || 0, decks: mix.deckIds?.length || 0 })} · ${order}`
}
