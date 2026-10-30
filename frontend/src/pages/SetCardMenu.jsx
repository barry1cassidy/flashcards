import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import MenuIcon from './MenuIcon'

export default function SetCardMenu({ group, pro, onListen, onOpen, onShare, onDelete }) {
  const { t } = useTranslation()
  const rootRef = useRef(null)
  const menuRef = useRef(null)
  const [open, setOpen] = useState(false)
  const hasDecks = Number(group.deckCount) > 0

  useLayoutEffect(() => {
    const card = rootRef.current?.closest('.deck-card')
    if (!card) {
      return undefined
    }
    card.classList.toggle('is-menu-open', open)
    return () => card.classList.remove('is-menu-open')
  }, [open])

  useEffect(() => {
    if (!open) {
      return undefined
    }
    function onPointerDown(event) {
      if (rootRef.current && !rootRef.current.contains(event.target)) {
        setOpen(false)
      }
    }
    function onKeyDown(event) {
      if (event.key === 'Escape') {
        setOpen(false)
      }
    }
    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  useLayoutEffect(() => {
    const menu = menuRef.current
    if (!open || !menu) {
      return
    }
    menu.classList.remove('is-up')
    const rect = menu.getBoundingClientRect()
    if (rect.bottom > window.innerHeight - 8 && rect.top > menu.offsetHeight + 16) {
      menu.classList.add('is-up')
    }
  }, [open, hasDecks])

  function choose(action) {
    setOpen(false)
    action()
  }

  const sections = []
  if (hasDecks) {
    sections.push([
      { key: 'listen', icon: 'listen', label: t('listen.menu'), proFeature: true, action: () => onListen(group) },
    ])
  }
  sections.push([
    { key: 'edit', icon: 'edit', label: t('groups.editGroup'), action: () => onOpen(group) },
  ])
  sections.push([
    { key: 'share', icon: 'share', label: t('share.share'), action: () => onShare(group) },
    {
      key: 'delete',
      icon: 'trash',
      label: t('groups.deleteGroup'),
      danger: true,
      action: () => onDelete(group),
    },
  ])

  return (
    <div className={`deck-overflow${open ? ' is-open' : ''}`} ref={rootRef}>
      <button
        className="deck-overflow-trigger"
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={t('decks.moreActions', { name: group.name })}
        onClick={() => setOpen((value) => !value)}
      >
        <MenuIcon name="more" />
      </button>
      {open ? (
        <div className="deck-overflow-menu" role="menu" ref={menuRef}>
          {sections.map((section, index) => (
            <div key={section[0].key}>
              {index > 0 ? <div className="user-menu-divider" /> : null}
              {section.map((item) => (
                <button
                  key={item.key}
                  className={`menu-link${item.danger ? ' is-danger' : ''}`}
                  type="button"
                  role="menuitem"
                  onClick={() => choose(item.action)}
                >
                  <MenuIcon name={item.icon} />
                  <span className="menu-link-text">{item.label}</span>
                  {item.proFeature && !pro ? <span className="menu-pro-tag">{t('settings.proBadge')}</span> : null}
                </button>
              ))}
            </div>
          ))}
        </div>
      ) : null}
    </div>
  )
}
