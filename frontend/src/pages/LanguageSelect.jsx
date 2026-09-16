import { SPEECH_LANGUAGES } from '../speechLanguages'

export default function LanguageSelect({ id, label, value, onChange, disabled, autoLabel }) {
  return (
    <label htmlFor={id}>
      {label}
      <select
        id={id}
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
      >
        {autoLabel ? <option value="">{autoLabel}</option> : null}
        {SPEECH_LANGUAGES.map((language) => (
          <option key={language.code} value={language.code}>
            {language.name}
          </option>
        ))}
      </select>
    </label>
  )
}
