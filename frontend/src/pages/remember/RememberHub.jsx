import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { clearPageMeta, setPageMeta } from '../../seo'
import { GUIDES } from './guides'

export default function RememberHub() {
  useEffect(() => {
    setPageMeta({
      title: 'What to Memorize with Flashcards — Zipdeck',
      description:
        'Flashcard guides for Mandarin vocabulary, a wedding speech, a business presentation, and an actor’s script lines. See the card, then study it on Zipdeck.',
      path: '/memorize',
      jsonLd: {
        '@context': 'https://schema.org',
        '@type': 'CollectionPage',
        name: 'What to memorize with flashcards',
        url: 'https://zipdeck.app/memorize',
        isPartOf: { '@id': 'https://zipdeck.app/#website' },
        mainEntity: {
          '@type': 'ItemList',
          itemListElement: GUIDES.map((guide, index) => ({
            '@type': 'ListItem',
            position: index + 1,
            name: guide.title,
            url: `https://zipdeck.app/memorize/${guide.slug}`,
          })),
        },
      },
    })
    return () => clearPageMeta()
  }, [])

  return (
    <article className="remember-page">
      <p className="kicker">Memorize</p>
      <h1>What do you need to remember?</h1>
      <p className="remember-lede">
        Flashcards work when the front of the card is the thing you will actually be asked, and the
        back is the thing you have to produce. These four are built from how people already study
        Chinese, give a toast, present at work, and learn a scene.
      </p>
      <div className="remember-grid">
        {GUIDES.map((guide) => (
          <Link key={guide.slug} to={`/memorize/${guide.slug}`} className="remember-card" style={{ '--guide-accent': guide.accent }}>
            <span className="remember-mini" aria-hidden="true">
              <span>{guide.face}</span>
            </span>
            <span className="remember-kicker">{guide.kicker}</span>
            <span className="remember-card-title">{guide.nav}</span>
            <span className="remember-card-body">{guide.lede}</span>
          </Link>
        ))}
      </div>
      <p className="compare-more">
        <Link to="/quizlet-alternative">A free Quizlet alternative</Link>
        {' · '}
        <Link to="/language-conversations">AI language conversations</Link>
      </p>
    </article>
  )
}
