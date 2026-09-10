import { useId } from 'react'
import { useTranslation } from 'react-i18next'

export function BrandMark({ className = 'brand-mark' }) {
  const raw = useId()
  const gid = `zipdeck-g-${raw.replace(/:/g, '')}`
  return (
    <svg className={className} viewBox="0 0 32 32" aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id={gid} x1="6%" y1="94%" x2="94%" y2="6%">
          <stop offset="0%" stopColor="#6E4BFF" />
          <stop offset="48%" stopColor="#E040C8" />
          <stop offset="100%" stopColor="#FF6B42" />
        </linearGradient>
      </defs>
      <rect width="32" height="32" rx="8.5" fill={`url(#${gid})`} />
      <path
        fill="none"
        stroke="#fff"
        strokeWidth="3.1"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M10 10.6h12L10 21.4h12"
      />
    </svg>
  )
}

export default function Brand() {
  const { t } = useTranslation()
  return (
    <div className="brand">
      <BrandMark />
      <span className="brand-word">{t('app.name')}</span>
    </div>
  )
}
