import { useEffect } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { useAuth } from '../../AuthContext'
import { clearPageMeta, setPageMeta } from '../../seo'
import ExampleDeck, { RichText } from '../remember/ExampleDeck'
import { categoryLabel, formatPostDate, postBySlug, readingMinutes, relatedPosts } from './catalog'

export default function BlogPost() {
  const { slug } = useParams()
  const post = postBySlug(slug)
  const { user } = useAuth()

  useEffect(() => {
    if (!post) {
      return undefined
    }
    const path = `/blog/${post.slug}`
    const url = `https://zipdeck.app${path}`
    const published = post.date || '2026-10-27'
    setPageMeta({
      title: post.seoTitle,
      description: post.description,
      path,
      type: 'article',
      jsonLd: {
        '@context': 'https://schema.org',
        '@graph': [
          {
            '@type': 'BlogPosting',
            headline: post.title,
            description: post.description,
            datePublished: published,
            dateModified: published,
            url,
            image: post.cover ? `https://zipdeck.app${post.cover}` : 'https://zipdeck.app/og.png',
            inLanguage: 'en',
            author: { '@id': 'https://zipdeck.app/#organization' },
            publisher: { '@id': 'https://zipdeck.app/#organization' },
            mainEntityOfPage: url,
            isPartOf: { '@id': 'https://zipdeck.app/blog#blog' },
            articleSection: categoryLabel(post.category),
          },
          {
            '@type': 'BreadcrumbList',
            itemListElement: [
              { '@type': 'ListItem', position: 1, name: 'Zipdeck', item: 'https://zipdeck.app/' },
              { '@type': 'ListItem', position: 2, name: 'Blog', item: 'https://zipdeck.app/blog' },
              { '@type': 'ListItem', position: 3, name: post.title, item: url },
            ],
          },
          ...(post.faqs?.length
            ? [
                {
                  '@type': 'FAQPage',
                  url,
                  mainEntity: post.faqs.map((item) => ({
                    '@type': 'Question',
                    name: item.q,
                    acceptedAnswer: { '@type': 'Answer', text: item.a },
                  })),
                },
              ]
            : []),
        ],
      },
    })
    return () => clearPageMeta()
  }, [post])

  if (!post) {
    return <Navigate to="/blog" replace />
  }

  const minutes = readingMinutes(post)
  const more = relatedPosts(post)
  const ctaTo = user ? post.ctaSignedInTo || '/' : '/register'
  const ctaLabel = user ? post.ctaSignedInLabel || 'Open My Decks' : 'Create a free account'

  return (
    <article className={post.highlights?.length ? 'blog-post blog-post-wide' : 'blog-post'}>
      <nav className="blog-crumb" aria-label="Breadcrumb">
        <Link to="/blog">Blog</Link>
        <span aria-hidden="true">/</span>
        <span>{categoryLabel(post.category)}</span>
      </nav>
      <header className="blog-post-hero">
        <p className="kicker">{post.plan}</p>
        <h1>{post.title}</h1>
        <p className="remember-lede">{post.lede}</p>
        {post.cover ? <img className="blog-post-cover" src={post.cover} alt="" /> : null}
        {post.highlights?.length ? (
          <div className="blog-highlights">
            {post.highlights.map((item) => (
              <article key={item.title} className="blog-highlight">
                <span>{item.kicker}</span>
                <strong>{item.title}</strong>
                <p>{item.text}</p>
              </article>
            ))}
          </div>
        ) : null}
        <p className="blog-byline">
          <span>{categoryLabel(post.category)}</span>
          <span>{formatPostDate(post.date || '2026-10-27')}</span>
          <span>{minutes} min read</span>
        </p>
      </header>

      <div className="blog-article-grid">
        <nav className="blog-toc" aria-label="On this page">
          <p>On this page</p>
          {post.sections.map((section) => (
            <a key={section.id} href={`#${section.id}`}>
              {section.heading}
            </a>
          ))}
          {post.faqs?.length ? <a href="#questions">Questions</a> : null}
        </nav>
        <div className="blog-prose">
          {post.sections.map((section) => (
            <section key={section.id} id={section.id} className="blog-section">
              <h2>{section.heading}</h2>
              {section.blocks.map((block, index) => (
                <Block key={`${section.id}-${index}`} block={block} accent={post.accent} />
              ))}
            </section>
          ))}

          {post.faqs?.length ? (
            <section id="questions" className="blog-section">
              <h2>Questions</h2>
              <div className="blog-faqs">
                {post.faqs.map((item) => (
                  <details key={item.q}>
                    <summary>{item.q}</summary>
                    <p>{item.a}</p>
                  </details>
                ))}
              </div>
            </section>
          ) : null}

          {post.notes?.length ? (
            <p className="blog-note-line">{post.notes[0]}</p>
          ) : null}

          {post.sources?.length ? (
            <section className="blog-section">
              <h2>Sources</h2>
              <ul className="guide-sources">
                {post.sources.map((source) => (
                  <li key={source.href}>
                    <a href={source.href} target="_blank" rel="noreferrer">
                      {source.label}
                    </a>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          <div className="guide-cta">
            <h2>Try it on a deck of your own</h2>
            <p>
              Study modes and spaced repetition are free. Pro adds AI decks, Listen, Language Studio,
              mixes, pictures, rehearsal, and an offline copy.
            </p>
            <div className="guide-cta-actions">
              <Link className="btn primary" to={ctaTo}>
                {ctaLabel}
              </Link>
              <Link className="btn" to="/pro">
                See what Pro adds
              </Link>
            </div>
          </div>
        </div>
      </div>

      {more.length ? (
        <section className="blog-section blog-related">
          <h2>Keep reading</h2>
          <div className="blog-grid">
            {more.map((item) => (
              <Link key={item.slug} to={`/blog/${item.slug}`} className="blog-tile">
                {item.cover ? (
                  <span className="blog-tile-cover-wrap">
                    <img className="blog-tile-cover" src={item.cover} alt="" />
                  </span>
                ) : null}
                <span className="blog-tile-body">
                  <span className="blog-tile-meta">
                    <span style={{ color: item.accent }}>{categoryLabel(item.category)}</span>
                    <span>{readingMinutes(item)} min read</span>
                  </span>
                  <span className="blog-tile-title">{item.title}</span>
                  <span className="blog-tile-excerpt">{item.excerpt}</span>
                  <span className="blog-tile-foot">
                    <span>{formatPostDate(item.date || '2026-10-27')}</span>
                    <span>Read more</span>
                  </span>
                </span>
              </Link>
            ))}
          </div>
        </section>
      ) : null}
    </article>
  )
}

function Block({ block, accent }) {
  if (block.type === 'p') {
    return (
      <p>
        <Text value={block.text} />
      </p>
    )
  }
  if (block.type === 'ul' || block.type === 'ol') {
    const Tag = block.type
    return (
      <Tag>
        {block.items.map((item, index) => (
          <li key={index}>
            <Text value={item} />
          </li>
        ))}
      </Tag>
    )
  }
  if (block.type === 'steps') {
    return (
      <ol className="blog-steps">
        {block.items.map((item) => (
          <li key={item.title}>
            <strong>{item.title}</strong>
            <span>{item.text}</span>
          </li>
        ))}
      </ol>
    )
  }
  if (block.type === 'callout') {
    return (
      <aside className="blog-callout">
        <strong>{block.title}</strong>
        <p>{block.text}</p>
      </aside>
    )
  }
  if (block.type === 'cards') {
    return <ExampleDeck cards={block.cards} accent={accent} />
  }
  if (block.type === 'chart') {
    return <FeatureChart block={block} />
  }
  if (block.type === 'split') {
    return (
      <div className="blog-split">
        {block.items.map((item) => (
          <article key={item.title}>
            <span>{item.kicker}</span>
            <strong>{item.title}</strong>
            <p>{item.text}</p>
          </article>
        ))}
      </div>
    )
  }
  if (block.type === 'matrix') {
    return (
      <div className="blog-matrix">
        {block.rows.map((row) => (
          <section key={row.label} className="blog-matrix-row">
            <h3>{row.label}</h3>
            <div className="blog-matrix-cells">
              {row.cells.map((cell) => (
                <div key={cell.name} className={cell.name === 'Zipdeck' ? 'is-zipdeck' : undefined}>
                  <span>{cell.name}</span>
                  <p>{cell.text}</p>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
    )
  }
  return null
}

function FeatureChart({ block }) {
  return (
    <div className="blog-chart" tabIndex={0}>
      <table>
        <caption>
          {`Zipdeck compared with ${block.columns
            .filter((column) => column.name !== 'Zipdeck')
            .map((column) => column.name)
            .join(' and ')}. Figures checked October 27, 2026.`}
        </caption>
        <thead>
          <tr>
            <th scope="col">Feature</th>
            {block.columns.map((column) => (
              <th key={column.name} scope="col" className={column.lead ? 'is-lead' : undefined}>
                {column.name}
                {column.lead ? <em>Leads</em> : null}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {block.rows.map((row) => (
            <tr key={row.label}>
              <th scope="row">{row.label}</th>
              {row.cells.map((cell, index) => (
                <td key={block.columns[index].name} className={block.columns[index].lead ? 'is-lead' : undefined}>
                  {cell.mark ? <Mark mark={cell.mark} /> : null}
                  <p>{cell.text}</p>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function Mark({ mark }) {
  const label = mark === 'yes' ? 'Yes' : mark === 'part' ? 'Partly' : 'No'
  return <span className={`blog-mark blog-mark-${mark}`}>{label}</span>
}

function Text({ value }) {
  if (Array.isArray(value)) {
    return <RichText parts={value} />
  }
  return value
}
