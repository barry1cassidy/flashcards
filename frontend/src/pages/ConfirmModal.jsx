import { useTranslation } from 'react-i18next'
import Modal from './Modal'

export default function ConfirmModal({ title, message, confirmLabel, danger = false, onConfirm, onCancel }) {
  const { t } = useTranslation()
  return (
    <Modal
      variant="sheet"
      title={title}
      onClose={onCancel}
      footer={
        <div className="modal-actions">
          <button className={danger ? 'btn danger' : 'btn primary'} type="button" onClick={onConfirm}>
            {confirmLabel}
          </button>
          <button className="btn ghost" type="button" onClick={onCancel}>
            {t('common.cancel')}
          </button>
        </div>
      }
    >
      <p className="muted">{message}</p>
    </Modal>
  )
}
