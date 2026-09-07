import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import MarketingHeader, { MarketingFooter } from './MarketingHeader'

const MODE_KEYS = ['flip', 'quiz', 'write', 'match', 'audio']

export default function LoginPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [mode, setMode] = useState('flip')

  return (
    <div className="marketing">
      <MarketingHeader showLoginForm />

      <section className="hero">
        <div className="marketing-wrap hero-grid">
          <div>
            <p className="kicker">{t('marketing.kicker')}</p>
            <h1>{t('marketing.headline')}</h1>
            <p className="lede">{t('marketing.lede')}</p>
            <div className="hero-cta">
              <button className="btn primary" type="button" onClick={() => navigate('/register')}>
                {t('marketing.createFirstDeck')}
              </button>
              <span className="hero-note">{t('marketing.heroNote')}</span>
            </div>
          </div>
          <div className="scatter" aria-hidden="true">
            <div className="scard c1">
              <span className="pill">{t('marketing.cardChinese')}</span>
              <span className="front">Hello</span>
              <span className="back">你好 · nǐ hǎo</span>
            </div>
            <div className="scard c2">
              <span className="pill">{t('marketing.cardSpanish')}</span>
              <span className="front">Friend</span>
              <span className="back">amigo</span>
            </div>
            <div className="scard c3">
              <span className="pill">{t('marketing.cardMcat')}</span>
              <span className="front">Tachycardia</span>
              <span className="back">Resting HR &gt;100bpm</span>
            </div>
            <div className="scard c4">
              <span className="pill">{t('marketing.cardBar')}</span>
              <span className="front">Consideration</span>
              <span className="back">Bargained-for exchange</span>
            </div>
          </div>
        </div>
      </section>

      <section className="modes" id="modes">
        <div className="marketing-wrap">
          <h2>{t('marketing.modesTitle')}</h2>
          <p className="sub">{t('marketing.modesSub')}</p>
          <div className="tabs" role="tablist" aria-label={t('marketing.studyModes')}>
            {MODE_KEYS.map((key) => (
              <button
                key={key}
                className="tab-btn"
                type="button"
                role="tab"
                aria-selected={mode === key}
                onClick={() => setMode(key)}
              >
                {t(`study.${key}`)}
              </button>
            ))}
          </div>
          <div className="tab-panel active" role="tabpanel">
            <div>
              <h3>{t(`marketing.mode.${mode}.title`)}</h3>
              <p>{t(`marketing.mode.${mode}.body`)}</p>
            </div>
            <div className="demo-box">
              {t(`marketing.mode.${mode}.demo`)}
              <small>{t(`marketing.mode.${mode}.hint`)}</small>
            </div>
          </div>
        </div>
      </section>

      <section className="library" id="library">
        <div className="marketing-wrap">
          <h2>{t('marketing.libraryTitle')}</h2>
          <p className="sub">{t('marketing.librarySub')}</p>
          <div className="preview-grid">
            <div className="deck-card">
              <span className="pill cobalt">{t('marketing.cardChinese')}</span>
              <h3>{t('marketing.previewChineseDeck')}</h3>
              <span className="meta">{t('marketing.previewChineseMeta')}</span>
            </div>
            <div className="deck-card">
              <span className="pill coral">{t('marketing.cardSpanish')}</span>
              <h3>{t('marketing.previewSpanishDeck')}</h3>
              <span className="meta">{t('marketing.previewSpanishMeta')}</span>
            </div>
            <div className="deck-card">
              <span className="pill gold">{t('marketing.cardMcat')}</span>
              <h3>{t('marketing.previewMcatDeck')}</h3>
              <span className="meta">{t('marketing.previewMcatMeta')}</span>
            </div>
            <div className="deck-card">
              <span className="pill mint">{t('marketing.cardBar')}</span>
              <h3>{t('marketing.previewBarDeck')}</h3>
              <span className="meta">{t('marketing.previewBarMeta')}</span>
            </div>
          </div>
        </div>
      </section>

      <section className="stat-band" id="stat">
        <div className="marketing-wrap stat-grid">
          <p className="big">
            <span>2×</span> {t('marketing.statLead')}
          </p>
          <p>{t('marketing.statBody')}</p>
        </div>
      </section>

      <section className="footer-cta">
        <div className="marketing-wrap">
          <h2>{t('marketing.footerCta')}</h2>
          <Link className="btn primary" to="/register">
            {t('marketing.createFirstDeck')}
          </Link>
        </div>
      </section>

      <MarketingFooter />
    </div>
  )
}

export { default as Brand } from './Brand'
