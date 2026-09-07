import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { subscribeSaving } from '../saving'

export default function SavingIndicator() {
  const { t } = useTranslation()
  const [saving, setSaving] = useState(false)

  useEffect(() => subscribeSaving(setSaving), [])

  if (!saving) {
    return null
  }

  return (
    <div className="saving-indicator" role="status" aria-live="polite" aria-busy="true">
      <span className="saving-spinner" aria-hidden="true" />
      {t('common.saving')}
    </div>
  )
}
