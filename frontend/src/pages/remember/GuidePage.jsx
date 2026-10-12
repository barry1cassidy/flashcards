import { useEffect } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { clearPageMeta, setPageMeta } from '../../seo'
import ExampleDeck, { RichText } from './ExampleDeck'
import { GUIDES, guideBySlug } from './guides'

export default function GuidePage() {
  const { slug } = useParams()
  const guide = guideBySlug(slug)

  useEffect(() => {
    if (!guide) {
      return undefined
    }
    const path = `/memorize/${guide.slug}`
    setPageMeta({
      title: guide.seoTitle,
      description: guide.description,
      path,
      jsonLd: {
        '@context': 'https://schema.org',
        '@type': 'HowTo',
        name: guide.title,
        description: guide.description,
        url: `https://zipdeck.app${path}`,
        inLanguage: 'en',
        isAccessibleForFree: true,
        step: guide.rules.map((rule, index) => ({
          '@type': 'HowToStep',
          position: index + 1,
          name: rule.title,
          text: rule.body,
        })),
      },
    })
    return () => clearPageMeta()
  }, [guide])

  if (!guide) {
    return <Navigate to="/memorize" replace />
  }

  const others = GUIDES.filter((item) => item.slug !== guide.slug)

  return (
    <article className="remember-page guide-page">
      <Link to="/memorize" className="page-back">
        All the ways to memorize
      </Link>
      <p className="kicker">{guide.kicker}</p>
      <h1>{guide.title}</h1>
      <p className="remember-lede">{guide.lede}</p>

      <div className="guide-layout">
        <ExampleDeck cards={guide.cards} accent={guide.accent} />
        <div>
          <h2>How the card should be built</h2>
          <ul className="guide-rules">
            {guide.rules.map((rule) => (
              <li key={rule.title}>
                <strong>{rule.title}</strong>
                <span>{rule.body}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {guide.sections.map((section) => (
        <section key={section.heading} className="guide-section">
          <h2>{section.heading}</h2>
          {section.body.map((parts) => (
            <p key={parts.map((part) => (typeof part === 'string' ? part : part.t)).join('')}>
              <RichText parts={parts} />
            </p>
          ))}
        </section>
      ))}

      <div className="guide-cta">
        <h2>Make the deck and rehearse it</h2>
        <p>
          Zipdeck keeps the front and the back, then brings the cards you miss back sooner. Create a
          free account, or start from a sample set and edit every line.
        </p>
        <div className="guide-cta-actions">
          <Link className="btn primary" to="/register">
            Create a free account
          </Link>
          {guide.sampleHref ? (
            <Link className="btn" to={guide.sampleHref}>
              {guide.sampleLabel}
            </Link>
          ) : null}
        </div>
      </div>

      <section className="guide-section">
        <h2>Sources</h2>
        <ul className="guide-sources">
          {guide.sources.map((source) => (
            <li key={source.href}>
              <a href={source.href} target="_blank" rel="noreferrer">
                {source.label}
              </a>
            </li>
          ))}
        </ul>
      </section>

      <section className="guide-section">
        <h2>Other things people memorize</h2>
        <div className="remember-grid remember-grid-compact">
          {others.map((item) => (
            <Link key={item.slug} to={`/memorize/${item.slug}`} className="remember-card" style={{ '--guide-accent': item.accent }}>
              <span className="remember-kicker">{item.kicker}</span>
              <span className="remember-card-title">{item.nav}</span>
            </Link>
          ))}
        </div>
      </section>
    </article>
  )
}
