import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import ColorPicker from './ColorPicker'
import { PRESET_COLORS } from '../colors'
import { translateError } from '../i18n/errors'

export default function GroupForm({ initialName = '', initialColor = PRESET_COLORS[0], submitLabel, onSubmit, onCancel }) {
  const { t } = useTranslation()
  const [name, setName] = useState(initialName)
  const [color, setColor] = useState(initialColor)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setBusy(true)
    try {
      await onSubmit({ name: name.trim(), color })
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <form className="stack" onSubmit={handleSubmit}>
      {error ? <div className="error">{translateError(t, error)}</div> : null}
      <label>
        {t('groups.groupName')}
        <input value={name} onChange={(e) => setName(e.target.value)} required maxLength={80} />
      </label>
      <div>
        <p className="field-label">{t('groups.themeColor')}</p>
        <ColorPicker value={color} onChange={setColor} />
      </div>
      <div className="header-actions">
        <button className="btn primary" type="submit" disabled={busy || !name.trim()}>
          {busy ? t('common.saving') : submitLabel}
        </button>
        {onCancel ? (
          <button className="btn ghost" type="button" onClick={onCancel}>
            {t('common.cancel')}
          </button>
        ) : null}
      </div>
    </form>
  )
}
