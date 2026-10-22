import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { api } from '../api'
import { useAuth } from '../AuthContext'
import { isProLicensed } from '../pro'
import { useResumeExpiredSubscription } from '../useResumeExpiredSubscription'
import { translateError } from '../i18n/errors'
import { STUDIO_LOCATION_ICONS, STUDIO_SCENARIOS, studioPairLabel, studioStatusLabel } from '../languageStudio'
import ConfirmModal from './ConfirmModal'
import MenuIcon from './MenuIcon'

const INTRO_POINTS = [
  { icon: 'cafe', title: 'studio.introPoint1Title', body: 'studio.introPoint1Body' },
  { icon: 'reveal', title: 'studio.introPoint2Title', body: 'studio.introPoint2Body' },
  { icon: 'listen', title: 'studio.introPoint3Title', body: 'studio.introPoint3Body' },
]

export default function LanguageStudioPage() {
  const { t } = useTranslation()
  const { user } = useAuth()
  useResumeExpiredSubscription()
  const navigate = useNavigate()
  const pro = isProLicensed(user)
  const [items, setItems] = useState([])
  const [ready, setReady] = useState(!pro)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState('all')
  const [pendingDelete, setPendingDelete] = useState(null)

  useEffect(() => {
    if (!pro) {
      setReady(true)
      return
    }
    let cancelled = false
    setReady(false)
    api('/api/language-studio/conversations')
      .then((rows) => {
        if (!cancelled) {
          setItems(rows || [])
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err.message)
        }
      })
      .finally(() => {
        if (!cancelled) {
          setReady(true)
        }
      })
    return () => {
      cancelled = true
    }
  }, [pro])

  const visible = items.filter((item) => {
    if (filter === 'learned') {
      return item.status === 'LEARNED'
    }
    if (filter === 'learning') {
      return item.status !== 'LEARNED'
    }
    return true
  })

  async function remove(item) {
    setError('')
    try {
      await api(`/api/language-studio/conversations/${item.id}`, { method: 'DELETE' })
      setItems((current) => current.filter((row) => row.id !== item.id))
      setPendingDelete(null)
    } catch (err) {
      setError(err.message)
    }
  }

  const showIntro = !pro || (ready && items.length === 0)
  const showLibrary = pro && ready && items.length > 0

  return (
    <div className="page">
      {error ? <div className="error">{translateError(t, error)}</div> : null}
      {pro && !ready ? <p className="muted">{t('app.loading')}</p> : null}

      {showIntro ? <StudioIntro pro={pro} /> : null}

      {showLibrary ? (
        <>
          <div className="page-title">
            <div>
              <h1>{t('studio.title')}</h1>
              <p className="muted">{t('studio.subtitle')}</p>
            </div>
            <div className="page-title-actions">
              <button className="btn" type="button" onClick={() => navigate('/language-studio/samples')}>
                {t('studio.samples')}
              </button>
              <button className="btn primary" type="button" onClick={() => navigate('/language-studio/new')}>
                {t('studio.new')}
              </button>
            </div>
          </div>

          <div className="listen-choice-row studio-filters" role="radiogroup" aria-label={t('studio.filters')}>
            {[
              ['all', 'studio.filterAll'],
              ['learning', 'studio.filterLearning'],
              ['learned', 'studio.filterLearned'],
            ].map(([id, label]) => (
              <button
                key={id}
                className={`btn${filter === id ? ' primary' : ''}`}
                type="button"
                aria-pressed={filter === id}
                onClick={() => setFilter(id)}
              >
                {t(label)}
              </button>
            ))}
          </div>

          {visible.length === 0 ? <p className="muted">{t('studio.filterEmpty')}</p> : null}

          {visible.length > 0 ? (
            <div className="studio-list">
              {visible.map((item) => (
                <article key={item.id} className="studio-card">
                  <div className="studio-card-copy">
                    <div className="studio-card-title">
                      <h2>{item.title}</h2>
                      <span className="studio-pill">{item.level}</span>
                      <span className={`studio-pill${item.status === 'LEARNED' ? ' is-learned' : ''}`}>
                        {studioStatusLabel(item.status, t)}
                      </span>
                    </div>
                    <p className="muted">
                      {t(`studio.scenarios.${item.scenario}`, { defaultValue: item.scenario })} · {studioPairLabel(item, t)} ·{' '}
                      {t('studio.turns', { count: item.turnCount })}
                    </p>
                  </div>
                  <div className="deck-card-actions">
                    <button
                      className="btn studio-mode-btn"
                      type="button"
                      onClick={() => navigate(`/listen?source=studio&id=${item.id}`)}
                    >
                      <MenuIcon name="listen" />
                      {t('listen.menu')}
                    </button>
                    <button
                      className="btn primary studio-mode-btn"
                      type="button"
                      onClick={() => navigate(`/language-studio/${item.id}`)}
                    >
                      <MenuIcon name="practice" />
                      {t('studio.practice')}
                    </button>
                    <button
                      className="listing-action danger"
                      type="button"
                      aria-label={t('common.deleteNamed', { name: item.title })}
                      onClick={() => setPendingDelete(item)}
                    >
                      <MenuIcon name="trash" />
                    </button>
                  </div>
                </article>
              ))}
            </div>
          ) : null}
        </>
      ) : null}

      {pendingDelete ? (
        <ConfirmModal
          title={t('studio.deleteTitle')}
          message={t('studio.deleteMessage', { name: pendingDelete.title })}
          confirmLabel={t('common.delete')}
          danger
          onConfirm={() => remove(pendingDelete)}
          onCancel={() => setPendingDelete(null)}
        />
      ) : null}
    </div>
  )
}

function StudioIntro({ pro }) {
  const { t } = useTranslation()

  return (
    <section className="studio-intro">
      <div className="studio-intro-top">
        <div className="studio-intro-copy">
          <h1>{t('studio.introTitle')}</h1>
          <p className="studio-intro-lede">{t('studio.introLede')}</p>
          <p className="studio-intro-why">{t('studio.introWhy')}</p>
          <div className="studio-intro-cta">
            {pro ? (
              <>
                <Link className="btn primary" to="/language-studio/new">
                  {t('studio.new')}
                </Link>
                <Link className="btn" to="/language-studio/samples">
                  {t('studio.samples')}
                </Link>
              </>
            ) : (
              <Link className="btn primary" to="/pro">
                {t('pro.goToPro')}
              </Link>
            )}
          </div>
          <p className="muted">{pro ? t('studio.samplesHint') : t('studio.introProNote')}</p>
        </div>

        <figure className="studio-intro-demo" aria-label={t('studio.introDemoCaption')}>
          <div className="studio-intro-demo-head">
            <strong>{t('studio.introDemoEyebrow')}</strong>
            <span className="studio-pill">A2</span>
          </div>
          <div className="studio-chat">
            <div className="studio-bubble is-them">
              <p className="studio-speaker">{t('studio.introDemoThem')}</p>
              <p className="studio-line">{t('studio.introDemoThemLine')}</p>
              <p className="muted">{t('studio.introDemoThemMeaning')}</p>
            </div>
            <div className="studio-bubble is-you">
              <p className="studio-speaker">{t('studio.introDemoYou')}</p>
              <p className="studio-line">{t('studio.introDemoYouLine')}</p>
              <p className="muted">{t('studio.introDemoYouMeaning')}</p>
            </div>
          </div>
          <figcaption>{t('studio.introDemoCaption')}</figcaption>
        </figure>
      </div>

      <div className="studio-intro-points">
        {INTRO_POINTS.map((point) => (
          <article key={point.title} className="studio-intro-point">
            <span className="studio-intro-point-icon" aria-hidden="true">
              <MenuIcon name={point.icon} />
            </span>
            <div>
              <h2>{t(point.title)}</h2>
              <p className="muted">{t(point.body)}</p>
            </div>
          </article>
        ))}
      </div>

      <div className="studio-intro-places-block">
        <h2>{t('studio.introPlacesTitle')}</h2>
        <ul className="studio-intro-places">
          {STUDIO_SCENARIOS.map((item) => (
            <li key={item} className={`studio-location studio-location-${item}`}>
              <span className="studio-location-icon" aria-hidden="true">
                <MenuIcon name={STUDIO_LOCATION_ICONS[item]} />
              </span>
              <span>{t(`studio.scenarios.${item}`)}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
