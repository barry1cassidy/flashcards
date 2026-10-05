import { useTranslation } from 'react-i18next'
import MenuIcon from './MenuIcon'

export default function ListingActions({ name, onShare, onDelete }) {
  const { t } = useTranslation()
  return (
    <div className="listing-actions">
      <button
        className="listing-action"
        type="button"
        aria-label={t('common.shareNamed', { name })}
        onClick={onShare}
      >
        <MenuIcon name="share" />
      </button>
      <button
        className="listing-action danger"
        type="button"
        aria-label={t('common.deleteNamed', { name })}
        onClick={onDelete}
      >
        <MenuIcon name="trash" />
      </button>
    </div>
  )
}
