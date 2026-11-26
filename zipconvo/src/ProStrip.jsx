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
