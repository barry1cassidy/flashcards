export function formatReviewHint(t, days, { thisSession = false, dueToday = false } = {}) {
  if (thisSession) {
    return t('study.reviewThisSession')
  }
  if (dueToday || days <= 0) {
    return t('study.reviewToday')
  }
  if (days === 1) {
    return t('study.reviewTomorrow')
  }
  return t('study.reviewInDays', { count: days })
}
