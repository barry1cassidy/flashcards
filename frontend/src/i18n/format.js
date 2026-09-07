import i18n from './index'

export function formatDate(value) {
  return new Date(value).toLocaleString(i18n.language === 'es' ? 'es' : 'en', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

export function formatDay(value) {
  if (!value) {
    return ''
  }
  const date = /^\d{4}-\d{2}-\d{2}$/.test(String(value)) ? new Date(`${value}T12:00:00`) : new Date(value)
  return date.toLocaleDateString(i18n.language === 'es' ? 'es' : 'en', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  })
}
