import { useTranslation } from 'react-i18next'
import { formatReviewHint } from '../reviewHints'

export default function RatingRow({ card, hideMissed = false, busy = false, dueToday = false, onRate }) {
  const { t } = useTranslation()
  return (
    <div className="rating-row flip-ratings">
      {hideMissed ? null : (
        <RatingButton
          kind="again"
          label={t('study.again')}
          hint={formatReviewHint(t, 0, { thisSession: true })}
          disabled={busy}
          onClick={() => onRate('AGAIN')}
        />
      )}
      <RatingButton
        kind="hard"
        label={t('study.hard')}
        hint={formatReviewHint(t, card?.hardDays ?? 1, { dueToday })}
        disabled={busy}
        onClick={() => onRate('HARD')}
      />
      <RatingButton
        kind="good"
        label={t('study.good')}
        hint={formatReviewHint(t, card?.goodDays ?? 1, { dueToday })}
        disabled={busy}
        onClick={() => onRate('GOOD')}
      />
      <RatingButton
        kind="easy"
        label={t('study.easy')}
        hint={formatReviewHint(t, card?.easyDays ?? 1, { dueToday })}
        disabled={busy}
        onClick={() => onRate('EASY')}
      />
    </div>
  )
}

function RatingButton({ kind, label, hint, disabled, onClick }) {
  return (
    <button className={`btn rating ${kind}`} type="button" disabled={disabled} onClick={onClick}>
      <span className="rating-label">{label}</span>
      <span className="rating-hint">{hint}</span>
    </button>
  )
}
