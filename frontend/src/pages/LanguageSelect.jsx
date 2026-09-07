import { SPEECH_LANGUAGES } from '../speechLanguages'

export default function LanguageSelect({ id, label, value, onChange }) {
  return (
    <label htmlFor={id}>
      {label}
      <select id={id} value={value} onChange={(event) => onChange(event.target.value)}>
        {SPEECH_LANGUAGES.map((language) => (
          <option key={language.code} value={language.code}>
            {language.name}
          </option>
        ))}
      </select>
    </label>
  )
}
