import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { rememberAfterAuth } from '../authRedirect'
import { shareCodeFromInput } from '../shareCode'
import DeckWelcome from './DeckWelcome'
import NativeGuestBar from './NativeGuestBar'

export default function NativeHome() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [shareInput, setShareInput] = useState('')
  const [shareOpen, setShareOpen] = useState(false)
  const shareCode = shareCodeFromInput(shareInput)

  function continueToAccount(from) {
    rememberAfterAuth(from)
    navigate('/register', { state: { from } })
  }

  function onShare(event) {
    event.preventDefault()
    if (!shareCode) {
      return
    }
    continueToAccount(`/?share=${shareCode}`)
  }

  const shareForm = (
    <form className="deck-share-add" onSubmit={onShare}>
      <input
        value={shareInput}
        onChange={(event) => setShareInput(event.target.value)}
        maxLength={200}
        autoCapitalize="characters"
        autoComplete="off"
        autoCorrect="off"
        spellCheck={false}
        placeholder={t('decks.addSharePlaceholder')}
        aria-label={t('decks.addSharePlaceholder')}
        className="deck-share-input"
        autoFocus={shareOpen}
      />
      <button className="btn" type="submit" disabled={!shareCode}>
        {t('decks.addShareButton')}
      </button>
    </form>
  )

  return (
    <div className="app-frame">
      <div className="app-pane">
        <NativeGuestBar />
        <main className="page-content">
          <div className="page">
            <DeckWelcome
              brand
              onCreate={() => continueToAccount('/?create=1')}
              shareOpen={shareOpen}
              onShowShare={() => setShareOpen(true)}
              shareForm={shareForm}
            />
          </div>
        </main>
      </div>
    </div>
  )
}
