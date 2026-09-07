import { useTranslation } from 'react-i18next'
import { useAuth } from '../AuthContext'
import { applyLocale, LOCALES } from '../i18n'

export default function LanguageSwitcher({ variant = 'menu' }) {
  const { t, i18n } = useTranslation()
  const { user, setLocale } = useAuth()
  const current = i18n.resolvedLanguage === 'es' ? 'es' : 'en'

  async function choose(code) {
    if (code === current) {
      return
    }
    if (user) {
      await setLocale(code)
    } else {
      await applyLocale(code)
    }
  }

  return (
    <div className={variant === 'pills' ? 'locale-pills' : 'locale-menu'} role="group" aria-label={t('language.label')}>
      {variant === 'menu' ? <p className="user-menu-label">{t('language.label')}</p> : null}
      {LOCALES.map((locale) => (
        <button
          key={locale.code}
          className={
            variant === 'pills'
              ? `locale-pill ${current === locale.code ? 'selected' : ''}`
              : `user-menu-item ${current === locale.code ? 'selected' : ''}`
          }
          type="button"
          role={variant === 'menu' ? 'menuitemradio' : 'radio'}
          aria-checked={current === locale.code}
          onClick={() => choose(locale.code)}
        >
          {t(locale.nameKey)}
        </button>
      ))}
    </div>
  )
}
