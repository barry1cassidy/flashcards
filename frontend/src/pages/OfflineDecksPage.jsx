import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { formatDate } from '../i18n/format'
import { useAuth } from '../AuthContext'
import { isProLicensed } from '../pro'
import ConfirmModal from './ConfirmModal'
import MenuIcon from './MenuIcon'
import { listOfflinePacks, removeOfflinePack } from '../offlinePacks'

export default function OfflineDecksPage() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const pro = isProLicensed(user)
  const [packs, setPacks] = useState(null)
  const [confirm, setConfirm] = useState(null)

  useEffect(() => {
    let cancelled = false
    listOfflinePacks()
      .then((found) => {
        if (!cancelled) {
          setPacks(found)
        }
      })
      .catch(() => {
        if (!cancelled) {
          setPacks([])
        }
      })
    return () => {
      cancelled = true
    }
  }, [])

  async function remove(pack) {
    await removeOfflinePack(pack.id)
    setPacks((current) => (current || []).filter((item) => item.id !== pack.id))
    setConfirm(null)
  }

  return (
    <div className="page">
      <div className="page-title">
        <h1>{t('offline.title')}</h1>
      </div>
      <p className="muted">{t('offline.intro')}</p>
      <section className="card-form offline-how">
        <div className="offline-how-row">
          <span className="offline-icon-sample is-focus" aria-hidden="true">
            <MenuIcon name="offline" />
          </span>
          <div>
            <h2 className="section-heading">{t('offline.howTitle')}</h2>
            <p className="muted">{t('offline.howBody')}</p>
          </div>
        </div>
      </section>
      {packs === null ? <p>{t('app.loading')}</p> : null}
      {user && !pro ? (
        <section className="card-form">
          <p>{t('offline.proRequired')}</p>
          <p>{t('offline.proWhy')}</p>
          <ul className="pro-feature-list">
            <li>{t('offline.proExample1')}</li>
            <li>{t('offline.proExample2')}</li>
            <li>{t('offline.proExample3')}</li>
          </ul>
          <Link className="btn primary" to="/pro">
            {t('pro.goToPro')}
          </Link>
        </section>
      ) : null}
      {packs && packs.length === 0 && (!user || pro) ? <p className="muted">{t('offline.empty')}</p> : null}
      {packs && packs.length > 0 ? (
        <div className="offline-list">
          {packs.map((pack) => (
            <section className="card-form" key={pack.id}>
              <h2 className="section-heading">{pack.name}</h2>
              <p className="muted">
                {t('decks.cards', { count: pack.cards.length })}
                {' · '}
                {t('offline.savedOn', { date: formatDate(pack.downloadedAt) })}
              </p>
              <div className="header-actions">
                <Link className="btn primary" to={`/offline/${pack.id}`}>
                  {t('offline.study')}
                </Link>
                <button
                  className="btn danger"
                  type="button"
                  onClick={() =>
                    setConfirm({
                      title: t('offline.removeTitle'),
                      message: t('offline.removeMessage', { name: pack.name }),
                      confirmLabel: t('offline.remove'),
                      onConfirm: () => remove(pack),
                    })
                  }
                >
                  {t('offline.remove')}
                </button>
              </div>
            </section>
          ))}
        </div>
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
