import { SPEECH_LANGUAGES } from '../speechLanguages'
import ChoiceMenu from './ChoiceMenu'

export default function LanguageSelect({ id, label, value, onChange, disabled, autoLabel, languages = SPEECH_LANGUAGES }) {
  const options = [
    ...(autoLabel ? [{ value: '', label: autoLabel }] : []),
    ...languages.map((language) => ({ value: language.code, label: language.name })),
  ]
  return (
    <ChoiceMenu
      id={id}
      label={label}
      value={value}
      options={options}
      onChange={onChange}
      disabled={disabled}
    />
  )
}
