import { useTranslation } from 'react-i18next'

export function BrandMark({ className = 'brand-mark' }) {
  return <img className={className} src="/brand-mark.png" alt="" draggable="false" />
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
