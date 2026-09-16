import { useEffect, useState } from 'react'
import { api } from '../api'

export default function AuthImage({ cardId, side, alt = '', className }) {
  const [url, setUrl] = useState(null)

  useEffect(() => {
    if (!cardId || !side) {
      return undefined
    }
    let objectUrl
    let cancelled = false
    api(`/api/cards/${cardId}/images/${side}`)
      .then((blob) => {
        if (cancelled || !blob) {
          return
        }
        objectUrl = URL.createObjectURL(blob)
        setUrl(objectUrl)
      })
      .catch(() => {
        if (!cancelled) {
          setUrl(null)
        }
      })
    return () => {
      cancelled = true
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl)
      }
    }
  }, [cardId, side])

  if (!url) {
    return null
  }
  return <img src={url} alt={alt} className={className} />
}
