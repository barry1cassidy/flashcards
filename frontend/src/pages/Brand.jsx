import { useTranslation } from 'react-i18next'

export default function Brand() {
  const { t } = useTranslation()
  return (
    <div className="brand">
      <span className="brand-mark" aria-hidden="true">
        ⇄
      </span>
      {t('app.name')}
    </div>
  )
}
