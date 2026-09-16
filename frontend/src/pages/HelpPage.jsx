import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

const SECTIONS = [
  { id: 'help-start', titleKey: 'help.startTitle' },
  { id: 'help-decks', titleKey: 'help.decksTitle' },
  { id: 'help-study', titleKey: 'help.studyTitle' },
  { id: 'help-sm2', titleKey: 'help.sm2Title' },
  { id: 'help-library', titleKey: 'help.libraryTitle' },
  { id: 'help-ai', titleKey: 'help.aiTitle' },
  { id: 'help-mix', titleKey: 'help.mixTitle' },
  { id: 'help-pro', titleKey: 'help.proTitle' },
  { id: 'help-settings', titleKey: 'help.settingsTitle' },
  { id: 'help-classes', titleKey: 'help.classesTitle' },
]

export default function HelpPage() {
  const { t } = useTranslation()

  function jump(id) {
    const el = document.getElementById(id)
    if (!el) {
      return
    }
    if (el instanceof HTMLDetailsElement) {
      el.open = true
    }
    el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  useEffect(() => {
    const id = window.location.hash.replace(/^#/, '')
    if (id) {
      jump(id)
    }
  }, [])

  return (
    <div className="page help-page">
      <div className="page-title">
        <div>
          <h1>{t('help.title')}</h1>
          <p className="muted">{t('help.subtitle')}</p>
        </div>
      </div>

      <nav className="help-toc" aria-label={t('help.tocLabel')}>
        {SECTIONS.map((section) => (
          <button key={section.id} className="help-toc-btn" type="button" onClick={() => jump(section.id)}>
            {t(section.titleKey)}
          </button>
        ))}
      </nav>

      <HelpSection id="help-start" title={t('help.startTitle')} defaultOpen>
        <p>{t('help.startIntro')}</p>
        <ol className="help-steps">
          <li>{t('help.startStep1')}</li>
          <li>{t('help.startStep2')}</li>
          <li>{t('help.startStep3')}</li>
        </ol>
        <p className="muted">{t('help.startHint')}</p>
      </HelpSection>

      <HelpSection id="help-decks" title={t('help.decksTitle')}>
        <p>{t('help.decksIntro')}</p>
        <ul className="help-list">
          <li>
            <strong>{t('help.decksCards')}</strong> {t('help.decksCardsBody')}
          </li>
          <li>
            <strong>{t('help.decksImages')}</strong> {t('help.decksImagesBody')}
          </li>
          <li>
            <strong>{t('help.decksSets')}</strong> {t('help.decksSetsBody')}
          </li>
          <li>
            <strong>{t('help.decksCsv')}</strong> {t('help.decksCsvBody')}
          </li>
          <li>
            <strong>{t('help.decksOrder')}</strong> {t('help.decksOrderBody')}
          </li>
        </ul>
      </HelpSection>

      <HelpSection id="help-study" title={t('help.studyTitle')}>
        <p>{t('help.studyIntro')}</p>
        <HelpFlipDemo t={t} />
        <ul className="help-list">
          <li>
            <strong>{t('study.flip')}</strong> {t('study.flipHint')}
          </li>
          <li>
            <strong>{t('study.quiz')}</strong> {t('study.quizHint')}
          </li>
          <li>
            <strong>{t('study.write')}</strong> {t('study.writeHint')}
          </li>
          <li>
            <strong>{t('study.match')}</strong> {t('study.matchHint')}
          </li>
          <li>
            <strong>{t('study.audio')}</strong> {t('study.audioHint')}
          </li>
        </ul>
        <p>{t('help.studyRatings')}</p>
        <p>{t('help.studyAfter')}</p>
      </HelpSection>

      <HelpSection id="help-sm2" title={t('help.sm2Title')}>
        <p>{t('help.sm2Intro')}</p>
        <p>{t('help.sm2How')}</p>
        <HelpSm2Demo t={t} />
        <p>{t('help.sm2Ratings')}</p>
        <p className="muted">{t('help.sm2Why')}</p>
      </HelpSection>

      <HelpSection id="help-library" title={t('help.libraryTitle')}>
        <p>{t('help.libraryIntro')}</p>
        <p>
          <Link to="/library">{t('library.title')}</Link>
        </p>
      </HelpSection>

      <HelpSection id="help-ai" title={t('help.aiTitle')}>
        <p>{t('help.aiBenefit')}</p>
        <HelpAiDemo t={t} />
        <ol className="help-steps">
          <li>{t('help.aiStep1')}</li>
          <li>{t('help.aiStep2')}</li>
          <li>{t('help.aiStep3')}</li>
        </ol>
        <p>{t('help.aiCredits')}</p>
        <p>
          <Link to="/create-with-ai">{t('agent.menu')}</Link>
        </p>
      </HelpSection>

      <HelpSection id="help-mix" title={t('help.mixTitle')}>
        <p>{t('help.mixBenefit')}</p>
        <HelpMixDemo t={t} />
        <ol className="help-steps">
          <li>{t('help.mixStep1')}</li>
          <li>{t('help.mixStep2')}</li>
          <li>{t('help.mixStep3')}</li>
        </ol>
        <p>
          <Link to="/mixes">{t('mix.menu')}</Link>
        </p>
      </HelpSection>

      <HelpSection id="help-pro" title={t('help.proTitle')}>
        <p>{t('help.proIntro')}</p>
        <ul className="help-list">
          <li>{t('help.proItemAi')}</li>
          <li>{t('help.proItemMix')}</li>
          <li>{t('help.proItemImages')}</li>
          <li>{t('help.proItemSync')}</li>
        </ul>
        <p>
          <Link to="/pro">{t('pro.goToPro')}</Link>
        </p>
      </HelpSection>

      <HelpSection id="help-settings" title={t('help.settingsTitle')}>
        <p>{t('help.settingsIntro')}</p>
        <p>
          <Link to="/settings">{t('nav.settings')}</Link>
        </p>
      </HelpSection>

      <HelpSection id="help-classes" title={t('help.classesTitle')}>
        <p>{t('help.classesIntro')}</p>
      </HelpSection>
    </div>
  )
}

function HelpSection({ id, title, defaultOpen = false, children }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <details
      id={id}
      className="card-form help-section"
      open={open}
      onToggle={(event) => {
        const next = event.currentTarget.open
        if (next !== open) {
          setOpen(next)
        }
      }}
    >
      <summary className="help-summary">{title}</summary>
      <div className="help-section-body">{children}</div>
    </details>
  )
}

function HelpFlipDemo({ t }) {
  const [flipped, setFlipped] = useState(false)
  return (
    <div className="help-demo">
      <p className="help-demo-label">{t('help.demoFlip')}</p>
      <button
        className={`help-flip${flipped ? ' is-flipped' : ''}`}
        type="button"
        onClick={() => setFlipped((open) => !open)}
        aria-pressed={flipped}
      >
        <span className="help-flip-face help-flip-front">{t('help.demoFlipFront')}</span>
        <span className="help-flip-face help-flip-back">{t('help.demoFlipBack')}</span>
      </button>
      <p className="muted small">{t('study.tapToFlip')}</p>
    </div>
  )
}

function HelpSm2Demo({ t }) {
  const [step, setStep] = useState(0)
  const days = [0, 1, 6, 16]

  function markGood() {
    setStep((current) => Math.min(current + 1, days.length - 1))
  }

  function markMissed() {
    setStep(1)
  }

  function reset() {
    setStep(0)
  }

  return (
    <div className="help-demo">
      <p className="help-demo-label">{t('help.demoSm2')}</p>
      <div className="help-sm2-track" aria-hidden="true">
        {['1', '6', '16'].map((label, index) => (
          <span key={label} className={`help-sm2-dot${step > index ? ' is-past' : ''}${step === index + 1 ? ' is-now' : ''}`}>
            {t('help.demoDay', { count: Number(label) })}
          </span>
        ))}
        <span className="help-sm2-card" style={{ left: `${4 + step * 28}%` }}>
          {t('help.demoSm2Card')}
        </span>
      </div>
      <p className="muted">
        {step === 0 ? t('help.demoSm2Start') : t('help.demoSm2Due', { count: days[step] })}
      </p>
      <div className="help-demo-actions">
        <button className="btn" type="button" onClick={markMissed}>
          {t('study.again')}
        </button>
        <button className="btn primary" type="button" onClick={markGood}>
          {t('study.good')}
        </button>
        <button className="btn ghost" type="button" onClick={reset}>
          {t('help.demoReset')}
        </button>
      </div>
    </div>
  )
}

function HelpAiDemo({ t }) {
  const [playing, setPlaying] = useState(false)

  function play() {
    setPlaying(false)
    window.requestAnimationFrame(() => setPlaying(true))
  }

  return (
    <div className="help-demo">
      <p className="help-demo-label">{t('help.demoAi')}</p>
      <div className={`help-ai-stage${playing ? ' is-playing' : ''}`} aria-hidden="true">
        <p className="help-ai-prompt">{t('help.demoAiPrompt')}</p>
        <div className="help-ai-cards">
          <span>{t('help.demoAiCard1')}</span>
          <span>{t('help.demoAiCard2')}</span>
          <span>{t('help.demoAiCard3')}</span>
        </div>
      </div>
      <div className="help-demo-actions">
        <button className="btn primary" type="button" onClick={play}>
          {t('help.demoAiPlay')}
        </button>
      </div>
    </div>
  )
}

function HelpMixDemo({ t }) {
  const [mixed, setMixed] = useState(false)
  return (
    <div className="help-demo">
      <p className="help-demo-label">{t('help.demoMix')}</p>
      <div className={`help-mix-stage${mixed ? ' is-mixed' : ''}`} aria-hidden="true">
        <div className="help-mix-pile help-mix-a">
          <span />
          <span />
          <span />
        </div>
        <div className="help-mix-pile help-mix-b">
          <span />
          <span />
          <span />
        </div>
        <p className="help-mix-caption">{mixed ? t('help.demoMixAfter') : t('help.demoMixBefore')}</p>
      </div>
      <div className="help-demo-actions">
        <button className="btn primary" type="button" onClick={() => setMixed((value) => !value)}>
          {mixed ? t('help.demoMixUndo') : t('help.demoMixPlay')}
        </button>
      </div>
    </div>
  )
}
