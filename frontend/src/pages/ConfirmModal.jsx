import { useTranslation } from 'react-i18next'

export default function ConfirmModal({ title, message, confirmLabel, danger = false, onConfirm, onCancel }) {
  const { t } = useTranslation()
  return (
    <div className="modal-backdrop" onClick={onCancel}>
      <div className="modal" onClick={(event) => event.stopPropagation()} role="dialog" aria-modal="true">
        <h2>{title}</h2>
        <p className="muted">{message}</p>
        <div className="header-actions">
          <button className={danger ? 'btn danger' : 'btn primary'} type="button" onClick={onConfirm}>
            {confirmLabel}
          </button>
          <button className="btn ghost" type="button" onClick={onCancel}>
            {t('common.cancel')}
          </button>
        </div>
      </div>
    </div>
  )
}
