import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { clearPageMeta, setPageMeta } from '../../seo'
import { CATEGORIES, POSTS, categoryLabel, formatPostDate, readingMinutes } from './catalog'

export default function BlogIndex() {
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    setPageMeta({
      title: 'Zipdeck Blog — Flashcard Guides and Comparisons',
      description:
        'How to memorize a speech, learn Chinese, and learn lines, plus Zipdeck’s study modes, AI, and Listen compared with Anki, Quizlet, and Knowt.',
      path: '/blog',
      type: 'website',
      jsonLd: {
        '@context': 'https://schema.org',
        '@graph': [
          {
            '@type': 'Blog',
            '@id': 'https://zipdeck.app/blog#blog',
            name: 'Zipdeck Blog',
            url: 'https://zipdeck.app/blog',
            description:
              'Guides for using Zipdeck, and comparisons with other flashcard apps.',
            publisher: { '@id': 'https://zipdeck.app/#organization' },
            inLanguage: 'en',
            blogPost: POSTS.map((post) => ({
              '@type': 'BlogPosting',
              headline: post.title,
              url: `https://zipdeck.app/blog/${post.slug}`,
              datePublished: post.date || '2026-10-27',
              description: post.description,
            })),
          },
          {
            '@type': 'BreadcrumbList',
            itemListElement: [
              { '@type': 'ListItem', position: 1, name: 'Zipdeck', item: 'https://zipdeck.app/' },
              { '@type': 'ListItem', position: 2, name: 'Blog', item: 'https://zipdeck.app/blog' },
            ],
          },
        ],
      },
    })
    return () => clearPageMeta()
  }, [])

  const featured = POSTS.find((post) => post.featured)
  const showFeatured = Boolean(featured && (filter === 'all' || filter === featured.category))
  const posts = (filter === 'all' ? POSTS : POSTS.filter((post) => post.category === filter)).filter(
    (post) => !(showFeatured && post.featured),
  )

  return (
    <article className="blog-index">
      <header className="blog-index-hero">
        <p className="kicker">The Zipdeck blog</p>
        <h1>Learn it loud enough to remember.</h1>
        <p className="remember-lede">
          How the features work, when to use them, and how they compare with Anki, Quizlet, and Knowt.
          Written from the product as it is.
        </p>
      </header>

      {showFeatured ? <FeaturedPost post={featured} /> : null}

      <div className="blog-filters" role="tablist" aria-label="Blog categories">
        {CATEGORIES.map((category) => (
          <button
            key={category.id}
            type="button"
            role="tab"
            aria-selected={filter === category.id}
            className={filter === category.id ? 'is-active' : undefined}
            onClick={() => setFilter(category.id)}
          >
            {category.label}
          </button>
        ))}
      </div>

      <div className="blog-grid">
        {posts.map((post) => (
          <PostCard key={post.slug} post={post} />
        ))}
      </div>
    </article>
  )
}

function FeaturedPost({ post }) {
  return (
    <Link to={`/blog/${post.slug}`} className="blog-feature">
      <span className="blog-feature-cover-wrap">
        <img className="blog-feature-cover" src={post.cover} alt="" />
      </span>
      <span className="blog-feature-copy">
        <span className="blog-meta">
          <span>Featured</span>
          <span style={{ color: post.accent }}>{categoryLabel(post.category)}</span>
          <span>{readingMinutes(post)} min read</span>
        </span>
        <span className="blog-feature-title">{post.title}</span>
        <span className="blog-feature-excerpt">{post.excerpt}</span>
        <span className="blog-tile-foot">
          <span>{formatPostDate(post.date)}</span>
          <span>Read article</span>
        </span>
      </span>
    </Link>
  )
}

function PostCard({ post }) {
  return (
    <Link to={`/blog/${post.slug}`} className="blog-tile">
      <span className="blog-tile-cover-wrap">
        <img className="blog-tile-cover" src={post.cover} alt="" />
      </span>
      <span className="blog-tile-body">
        <span className="blog-tile-meta">
          {post.featured ? <span>Featured</span> : null}
          <span style={{ color: post.accent }}>{categoryLabel(post.category)}</span>
          <span>{readingMinutes(post)} min read</span>
        </span>
        <span className="blog-tile-title">{post.title}</span>
        <span className="blog-tile-excerpt">{post.excerpt}</span>
        <span className="blog-tile-foot">
          <span>{formatPostDate(post.date || '2026-10-27')}</span>
          <span>Read more</span>
        </span>
      </span>
    </Link>
  )
}
