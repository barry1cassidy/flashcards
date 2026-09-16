import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import AuthImage from './AuthImage'

const MAX_IMAGE_BYTES = 5 * 1024 * 1024
const ACCEPT = 'image/jpeg,image/png,image/gif,.jpg,.jpeg,.png,.gif'

export default function CardImageField({
  side,
  cardId,
  hasImage = false,
  file = null,
  removed = false,
  isPro = false,
  disabled = false,
  onFile,
  onRemove,
  onNeedPro,
  onError,
}) {
  const { t } = useTranslation()
  const inputRef = useRef(null)
  const [preview, setPreview] = useState(null)
  const showSaved = Boolean(cardId && hasImage && !removed && !file)

  useEffect(() => {
    if (!file) {
      setPreview(null)
      return undefined
    }
    const url = URL.createObjectURL(file)
    setPreview(url)
    return () => URL.revokeObjectURL(url)
  }, [file])

  function openPicker() {
    if (!isPro) {
      onNeedPro?.()
      return
    }
    inputRef.current?.click()
  }

  function pickFile(event) {
    const next = event.target.files?.[0]
    event.target.value = ''
    if (!next) {
      return
    }
    if (next.size > MAX_IMAGE_BYTES) {
      onError?.(t('errors.imageTooLarge'))
      return
    }
    onError?.('')
    onFile?.(next)
  }

  const hasPreview = Boolean(preview) || showSaved

  return (
    <div className="card-image-field">
      {preview ? (
        <img src={preview} alt="" className="card-image-preview" />
      ) : showSaved ? (
        <AuthImage cardId={cardId} side={side} alt="" className="card-image-preview" />
      ) : null}
      <p className="card-image-hint">{t('decks.cardImageHint')}</p>
      <div className="card-image-actions">
        <button className="card-image-action" type="button" disabled={disabled} onClick={openPicker}>
          {hasPreview ? t('decks.replaceImage') : t('decks.addImage')}
        </button>
        <input ref={inputRef} type="file" accept={ACCEPT} hidden onChange={pickFile} />
        {hasPreview ? (
          <button className="card-image-action" type="button" disabled={disabled} onClick={onRemove}>
            {t('common.remove')}
          </button>
        ) : null}
      </div>
    </div>
  )
}
