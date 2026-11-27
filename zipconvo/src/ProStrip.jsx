import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

export default function ProStrip() {
  const { t } = useTranslation()
  return (
    <Link className="pro-strip" to="/pro">
      <span className="pro-strip-badge">{t('conversations.proKicker')}</span>
      <span className="pro-strip-copy">
        <strong>{t('conversations.proTitle')}</strong>
        <span>{t('conversations.proPitchShort')}</span>
      </span>
    </Link>
  )
}

export function StartPro({ compact = false }) {
  const { t } = useTranslation()
  return (
    <section className={compact ? 'start-pro is-compact' : 'start-pro'}>
      <p className="start-pro-badge">{t('conversations.proKicker')}</p>
      <div>
        <h2>{t('conversations.proTitle')}</h2>
        <p>{t(compact ? 'conversations.proPitchShort' : 'conversations.proPitchHome')}</p>
      </div>
      <ul className="start-pro-examples">
        <li>
          <img src="/scenes/scene-interview.jpg" alt="" />
          <span>{t('conversations.proExample1')}</span>
        </li>
        <li>
          <img src="/scenes/scene-pharmacy.jpg" alt="" />
          <span>{t('conversations.proExample2')}</span>
        </li>
        <li>
          <span className="start-pro-own" aria-hidden="true">+</span>
          <span>{t('conversations.proExample3')}</span>
        </li>
      </ul>
      <Link className="btn upgrade" to="/pro">
        {t('conversations.upgrade')}
      </Link>
    </section>
  )
}

export function MoreScenes({ to = '/scenes', onClick }) {
  const { t } = useTranslation()
  const inner = (
    <>
      <span className="start-more-photos">
        <img src="/scenes/scene-airport.jpg" alt="" />
        <img src="/scenes/scene-restaurant.jpg" alt="" />
        <img src="/scenes/scene-taxi.jpg" alt="" />
        <img src="/scenes/scene-hotel.jpg" alt="" />
      </span>
      <span className="start-more-copy">
        <strong>{t('conversations.moreScenes')}</strong>
        <span>{t('conversations.moreScenesHint')}</span>
      </span>
    </>
  )
  if (onClick) {
    return (
      <button className="start-more" type="button" onClick={onClick}>
        {inner}
      </button>
    )
  }
  return (
    <Link className="start-more" to={to}>
      {inner}
    </Link>
  )
}
