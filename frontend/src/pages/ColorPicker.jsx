import { useTranslation } from 'react-i18next'
import { contrastText, normalizeHex, PRESET_COLORS } from '../colors'

export default function ColorPicker({ value, onChange }) {
  const { t } = useTranslation()
  const color = normalizeHex(value)
  return (
    <div className="color-picker">
      <div className="swatch-row">
        {PRESET_COLORS.map((preset) => (
          <button
            key={preset}
            type="button"
            className={`swatch ${color === preset ? 'selected' : ''}`}
            style={{ background: preset }}
            aria-label={preset}
            onClick={() => onChange(preset)}
          />
        ))}
      </div>
      <label className="custom-color">
        {t('common.custom')}
        <input
          type="color"
          value={color}
          onChange={(event) => onChange(normalizeHex(event.target.value))}
        />
      </label>
    </div>
  )
}

export function GroupBadge({ group }) {
  if (!group) {
    return null
  }
  const background = normalizeHex(group.color)
  return (
    <span className="group-badge" style={{ background, color: contrastText(background) }}>
      {group.name}
    </span>
  )
}
