import { useTranslation } from 'react-i18next'
import { STUDIO_RATE_KINDS, STUDIO_STATUSES, studioStatusLabel } from '../languageStudio'

const RATE_HINTS = {
  LEARNING: 'studio.rateLearningHint',
  GETTING: 'studio.rateGettingHint',
  READY: 'studio.rateReadyHint',
  LEARNED: 'studio.rateLearnedHint',
}

export default function StudioRatePanel({ saving = false, onChoose, lead = null, footer = null }) {
  const { t } = useTranslation()
  return (
    <>
      <div className="page-title">
        <div>
          <h1>{t('studio.rateTitle')}</h1>
          <p className="muted">{t('studio.rateIntro')}</p>
        </div>
      </div>
      {lead}
      <div className="rating-row studio-ratings">
        {STUDIO_STATUSES.map((status) => (
          <button
            key={status}
            className={`btn rating ${STUDIO_RATE_KINDS[status]}`}
            type="button"
            disabled={saving}
            onClick={() => onChoose(status)}
          >
            <span className="rating-label">{studioStatusLabel(status, t)}</span>
            <span className="rating-hint">{t(RATE_HINTS[status])}</span>
          </button>
        ))}
      </div>
      <p className="muted studio-rate-note">{t('studio.rateLearnedNote')}</p>
      {footer}
    </>
  )
}
