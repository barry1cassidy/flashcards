const ANKI_IOS = 'https://apps.apple.com/us/app/ankimobile-flashcards/id373493387'
const ANKI_PRICE = 'https://faqs.ankiweb.net/why-does-ankimobile-cost-more-than-a-typical-mobile-app.html'
const QUIZLET_STUDY = 'https://help.quizlet.com/hc/en-us/articles/360030841732-Studying-on-Quizlet'
const QUIZLET_LEARN = 'https://help.quizlet.com/hc/en-us/articles/360030986971-Studying-with-Learn'
const QUIZLET_SRS = 'https://help.quizlet.com/hc/en-us/articles/48324742264077-Studying-with-Spaced-Repetition'
const QUIZLET_TEST = 'https://help.quizlet.com/hc/en-us/articles/360030642972-Studying-with-Test'
const QUIZLET_EXPORT = 'https://help.quizlet.com/hc/en-us/articles/360034345672-Exporting-your-sets'
const KNOWT_FREE = 'https://help.knowt.com/en/articles/16905163-what-s-included-in-the-free-plan-for-students'
const PCMAG = 'https://au.pcmag.com/language-learning/41677/quizlet'

const checked = [
  'Prices and limits for other apps were read from their help centers and store listings on October 27, 2026. They change. The Zipdeck column is how this app works.',
]

export const comparePosts = [
  {
    slug: 'best-flashcard-apps-2026',
    category: 'comparisons',
    accent: '#4c6fff',
    mark: '2026',
    plan: 'Comparison',
    featured: true,
    cover: '/covers/cover-apps.jpg',
    title: 'Anki, Quizlet, Knowt, and Zipdeck in 2026',
    seoTitle: 'Best Flashcard Apps in 2026: Anki, Quizlet, Knowt, and Zipdeck',
    description:
      'A 2026 comparison of Anki, Quizlet, Knowt, and Zipdeck on free study, ads, spaced repetition, Language Studio, and audio flashcards. Sources checked October 27, 2026.',
    excerpt:
      'Anki, Quizlet, Knowt, and Zipdeck compared on free study, ads, spaced repetition, and the tools for speaking. Sources checked October 27, 2026.',
    lede: 'Four flashcard apps, read against their help centers and store listings. Free study, ads, and the tools for speaking are in the chart. What each advanced plan costs is further down.',
    highlights: [
      {
        kicker: 'Free',
        title: 'No ads, no round cap',
        text: 'Flip, Quiz, Write, Match, and Audio Review stay free on the website and both apps.',
      },
      {
        kicker: 'Audio',
        title: 'Hear the card, then answer',
        text: 'Audio Review is free. Listen is the hands-free player. The chart shows who offers that pair.',
      },
      {
        kicker: 'Speaking',
        title: 'Language Studio',
        text: 'A scene you practice line by line, from A1 to C1. The others do not build this.',
      },
    ],
    sections: [
      {
        id: 'chart',
        heading: 'Where Zipdeck leads',
        blocks: [
          {
            type: 'chart',
            columns: [
              { name: 'Zipdeck', lead: true },
              { name: 'Anki' },
              { name: 'Quizlet' },
              { name: 'Knowt' },
            ],
            rows: [
              {
                label: 'Free study, no round cap',
                cells: [
                  { mark: 'yes', text: 'Flip, Quiz, Write, Match, Audio Review' },
                  { mark: 'yes', text: 'Desktop and AnkiDroid are free' },
                  { mark: 'part', text: 'Flashcards are free. Learn is limited.' },
                  { mark: 'yes', text: 'Learn, tests, Match, and flashcards' },
                ],
              },
              {
                label: 'No ads',
                cells: [
                  { mark: 'yes', text: 'Free and Pro, website and apps' },
                  { mark: 'yes', text: 'The official apps are not an ad product' },
                  { mark: 'no', text: 'A 2026 review reports ads on free' },
                  { mark: 'no', text: 'Ads until you pay for Ultra' },
                ],
              },
              {
                label: 'Spaced repetition in the apps',
                cells: [
                  { mark: 'yes', text: 'SM-2 on the website and both apps' },
                  { mark: 'yes', text: 'SM-2 and FSRS' },
                  { mark: 'part', text: 'Inside Flashcards, on the website only' },
                  { mark: 'yes', text: 'Listed on the free plan' },
                ],
              },
              {
                label: 'Audio flashcards',
                cells: [
                  { mark: 'yes', text: 'Audio Review is free. Listen is on Pro.' },
                  { mark: 'part', text: 'You can store a sound on a card' },
                  { mark: 'part', text: 'A set can be read aloud' },
                  { mark: 'part', text: 'Not listed as a listen-and-pause mode' },
                ],
              },
              {
                label: 'AI Language Studio',
                cells: [
                  { mark: 'yes', text: 'Spoken scenes from A1 to C1, on Pro' },
                  { mark: 'no', text: 'No scene you practice line by line' },
                  { mark: 'no', text: 'No spoken-scene studio' },
                  { mark: 'no', text: 'No spoken-scene studio' },
                ],
              },
              {
                label: 'Price of the advanced plan',
                cells: [
                  { text: '$5.99 a month, or $39.99 a year' },
                  { text: 'iPhone app $24.99 once. Desktop is free.' },
                  { text: 'Learn is Plus. Plus Unlimited removes the meters.' },
                  { text: 'Ultra is $24.99 a month, or $149.99 a year' },
                ],
              },
            ],
          },
          {
            type: 'callout',
            title: 'One place Anki still wins',
            text: 'A very large deck, offline images, and year-long statistics are Anki’s job. On free study, the Pro price, Language Studio, and audio flashcards, Zipdeck is the one in front.',
          },
        ],
      },
      {
        id: 'free',
        heading: 'What stays free',
        blocks: [
          {
            type: 'p',
            text: [
              { t: 'Flip, Quiz, Write Answer, Match, and Audio Review', to: '/blog/study-modes' },
              ' do not stop after a set number of rounds, and they do not show ads. Spaced repetition is included. Sample Sets, sharing, and classes are free too.',
            ],
          },
          {
            type: 'p',
            text: [
              'Quizlet’s help center says ',
              { t: 'Learn is for subscribers', h: QUIZLET_STUDY },
              ', with ',
              { t: 'a limited free try', h: QUIZLET_LEARN },
              '. Write sits inside Learn. ',
              { t: 'Test', h: QUIZLET_TEST },
              ' gives a free account one practice test per set. ',
              { t: 'Spaced repetition', h: QUIZLET_SRS },
              ' is inside Flashcards on the website, not in the mobile apps.',
            ],
          },
          {
            type: 'p',
            text: [
              'Knowt’s ',
              { t: 'free-plan article', h: KNOWT_FREE },
              ' keeps Learn, tests, Match, flashcards, and spaced repetition free, and puts ads on that plan. Anki’s computer app and AnkiDroid are free. The ',
              { t: 'official iPhone app', h: ANKI_IOS },
              ' is $24.99 once in the US store. ',
              { t: 'Anki’s FAQ', h: ANKI_PRICE },
              ' explains that purchase.',
            ],
          },
        ],
      },
      {
        id: 'studio',
        heading: 'Language Studio',
        blocks: [
          {
            type: 'split',
            items: [
              {
                kicker: 'Pro',
                title: 'A scene, not a word list',
                text: 'Language Studio writes a short conversation from A1 to C1. You answer turn by turn, or listen to both sides. Generating a scene uses one credit. Practicing it does not.',
              },
              {
                kicker: 'The gap',
                title: 'The others do not build this',
                text: 'Anki can hold a sound you add. Quizlet can read a set aloud. Knowt studies sets and notes. None of them writes the scene and then waits for your line.',
              },
            ],
          },
          {
            type: 'p',
            text: [
              'A word list gets you the noun. A scene at a pharmacy gets you the sentence you freeze on. The ',
              { t: 'Language Studio guide', to: '/blog/language-studio' },
              ' is the longer page.',
            ],
          },
        ],
      },
      {
        id: 'audio',
        heading: 'Audio flashcards',
        blocks: [
          {
            type: 'split',
            items: [
              {
                kicker: 'Free',
                title: 'Audio Review',
                text: 'Hear the prompt, reveal the answer, and rate the card. That rating moves the schedule. This mode stays on the free account.',
              },
              {
                kicker: 'Pro',
                title: 'Listen',
                text: 'The front, a pause, then the answer, while you walk. Listening does not grade the card, so you still sit down and rate. Listen can also play a Language Studio scene.',
              },
            ],
          },
          {
            type: 'p',
            text: [
              'Quizlet can read a set aloud. Anki can store audio on a card. Neither one pairs a free rated audio mode with a hands-free player. ',
              { t: 'How Listen works', to: '/blog/listen-to-flashcards' },
              '.',
            ],
          },
        ],
      },
      {
        id: 'price',
        heading: 'What the advanced plan costs',
        blocks: [
          {
            type: 'p',
            text: 'Zipdeck Pro is the cheaper monthly plan: $5.99 a month, or $39.99 a year. Knowt Ultra is $24.99 a month, or $149.99 a year. AnkiMobile is $24.99 once, and only for the official iPhone app.',
          },
          {
            type: 'split',
            items: [
              {
                kicker: 'Zipdeck Pro',
                title: '$5.99 a month',
                text: '$39.99 for the year. That adds Create with AI, Language Studio, Listen, Study Mixes, pictures, Rehearse in Order, and an offline text copy. One account covers the website and both apps.',
              },
              {
                kicker: 'Knowt Ultra',
                title: '$24.99 a month',
                text: 'Or $149.99 a year, from their help center on September 10, 2026. Ultra removes ads and lifts AI limits. The study modes were already on the free plan.',
              },
              {
                kicker: 'AnkiMobile',
                title: '$24.99 once',
                text: 'The US App Store price for the official iPhone app. Desktop, AnkiDroid, and AnkiWeb stay free. That purchase does not include Language Studio or Listen.',
              },
            ],
          },
          {
            type: 'p',
            text: [
              'Quizlet’s dollar price moves, so it is not listed as a number. Their help center says Learn is Plus, and a ',
              { t: '2026 PCMag review', h: PCMAG },
              ' says Plus itself stays metered until Plus Unlimited. ',
              { t: 'Exporting a set you created', h: QUIZLET_EXPORT },
              ' is text only. Zipdeck import and export of your own decks is a free CSV.',
            ],
          },
        ],
      },
    ],
    faqs: [
      {
        q: 'What is the best flashcard app in 2026?',
        a: 'For free study with no ads, Pro at $5.99 a month, Language Studio, and audio flashcards, Zipdeck is the one to open. Anki is still the stronger app for a huge deck, offline images, and statistics. Quizlet and Knowt are useful when the set already exists.',
      },
      {
        q: 'Is Zipdeck free?',
        a: 'Yes for study. Flip, Quiz, Write Answer, Match, Audio Review, and spaced repetition are free, with no ads and no round cap. Pro is $5.99 a month or $39.99 a year and adds Language Studio, Listen, and AI decks.',
      },
      {
        q: 'Is Zipdeck Pro cheaper than Knowt Ultra?',
        a: 'Yes. Zipdeck Pro is $5.99 a month or $39.99 a year. Knowt’s help center lists Ultra, the ad-free plan, at $24.99 a month or $149.99 a year. AnkiMobile is a different kind of price: $24.99 once on the US App Store, while Anki on desktop and Android is free.',
      },
      {
        q: 'Does Quizlet have spaced repetition?',
        a: 'Quizlet’s help center documents a spaced-repetition option inside Flashcards, and says it is only on the website. Zipdeck’s SM-2 schedule is included on the website and both apps.',
      },
    ],
    sources: [
      { label: 'AnkiMobile on the US App Store', href: ANKI_IOS },
      { label: 'Anki FAQ, why AnkiMobile costs more than a typical app', href: ANKI_PRICE },
      { label: 'Quizlet Help, Studying on Quizlet', href: QUIZLET_STUDY },
      { label: 'Quizlet Help, Studying with Learn', href: QUIZLET_LEARN },
      { label: 'Quizlet Help, Studying with Spaced Repetition', href: QUIZLET_SRS },
      { label: 'Quizlet Help, Studying with Test', href: QUIZLET_TEST },
      { label: 'Quizlet Help, Exporting your sets', href: QUIZLET_EXPORT },
      { label: 'Knowt Help, what’s included in the free plan (September 10, 2026)', href: KNOWT_FREE },
      { label: 'PCMag, Quizlet review (2026)', href: PCMAG },
    ],
    notes: checked,
    related: ['zipdeck-vs-anki', 'zipdeck-vs-quizlet', 'zipdeck-features'],
  },
  {
    slug: 'zipdeck-vs-anki',
    category: 'comparisons',
    accent: '#7c6cff',
    mark: 'SM-2',
    plan: 'Comparison',
    title: 'Zipdeck vs Anki',
    seoTitle: 'Zipdeck vs Anki: Which Flashcard App to Use',
    description:
      'Anki vs Zipdeck on price, SM-2 and FSRS, iPhone cost, offline study, and when a speech or a language scene is a better fit than a huge deck.',
    excerpt:
      'Anki is the power tool. Zipdeck is the app you can rehearse a speech in without learning what a note type is.',
    lede: 'Anki will take a huge deck further. Zipdeck is free on iPhone, Pro is $5.99 a month, and a speech or a scene does not need a note type.',
    sections: [
      {
        id: 'chart',
        heading: 'Where each one leads',
        blocks: [
          {
            type: 'chart',
            columns: [
              { name: 'Zipdeck', lead: true },
              { name: 'Anki' },
            ],
            rows: [
              {
                label: 'Free on iPhone',
                cells: [
                  { mark: 'yes', text: 'Study modes and SM-2, no separate app price' },
                  { mark: 'no', text: 'AnkiMobile is $24.99 once in the US store' },
                ],
              },
              {
                label: 'SM-2',
                cells: [
                  { mark: 'yes', text: 'The only scheduler. Nothing to install.' },
                  { mark: 'yes', text: 'SM-2, and FSRS if you turn it on' },
                ],
              },
              {
                label: 'Audio flashcards',
                cells: [
                  { mark: 'yes', text: 'Audio Review is free. Listen is on Pro.' },
                  { mark: 'part', text: 'You can store a sound on a card' },
                ],
              },
              {
                label: 'Language Studio',
                cells: [
                  { mark: 'yes', text: 'Spoken scenes, A1 to C1, on Pro' },
                  { mark: 'no', text: 'No scene you practice line by line' },
                ],
              },
              {
                label: 'A speech in order',
                cells: [
                  { mark: 'yes', text: 'Rehearse in Order, on Pro' },
                  { mark: 'part', text: 'You build the note type yourself' },
                ],
              },
              {
                label: 'Huge decks and offline images',
                cells: [
                  { mark: 'no', text: 'Not the tool for 100,000 cards' },
                  { mark: 'yes', text: 'Offline media, add-ons, and statistics' },
                ],
              },
              {
                label: 'Price of the extra tools',
                cells: [
                  { text: '$5.99 a month, or $39.99 a year' },
                  { text: '$24.99 once for the official iPhone app. Desktop is free.' },
                ],
              },
            ],
          },
        ],
      },
      {
        id: 'same-algorithm',
        heading: 'The same old algorithm, plus one Anki has and Zipdeck does not',
        blocks: [
          {
            type: 'p',
            text: [
              'Zipdeck schedules with SuperMemo 2 only. Rate a card Missed, Hard, Got it, or Easy, and the gap until the next review changes. ',
              { t: 'That guide', to: '/blog/spaced-repetition' },
              ' is the whole model. There is nothing to install.',
            ],
          },
          {
            type: 'p',
            text: [
              'The ',
              { t: 'AnkiMobile listing', h: ANKI_IOS },
              ' says the iPhone app uses the same SM-2 and FSRS algorithms as the computer version. FSRS is the newer scheduler. Zipdeck does not offer it. If you already live in Anki and you have opinions about desired retention, stay there. Moving a mature deck would also throw away your review history. Zipdeck import is a CSV of text, not an Anki package.',
            ],
          },
        ],
      },
      {
        id: 'price',
        heading: 'What “Anki is free” leaves out',
        blocks: [
          {
            type: 'p',
            text: [
              'On a computer, Anki is free. AnkiDroid is free. AnkiWeb sync is free. On iPhone and iPad the official app is AnkiMobile, listed at $24.99 in the US App Store, paid once. ',
              { t: 'Anki’s own FAQ', h: ANKI_PRICE },
              ' says that purchase supports the free apps. Unofficial apps with Anki in the name are a different product. Read the listing before you buy.',
            ],
          },
          {
            type: 'p',
            text: 'Zipdeck’s study modes, SM-2, Sample Sets, sharing, and classes are free on the website and both official apps. There is no separate iPhone price for those. Pro is $5.99 a month, or $39.99 a year, for AI, Listen, Language Studio, mixes, pictures, rehearsal, and offline flip.',
          },
        ],
      },
      {
        id: 'setup',
        heading: 'Setup is the real difference',
        blocks: [
          {
            type: 'p',
            text: 'Anki’s strength is also the reason people quit in the first afternoon. Note types, decks versus subdecks, filtered decks, add-ons, and the decision of whether new cards should be buried are all useful, and none of them are required to remember a definition. The computer app is where a lot of that setup happens. The App Store listing says AnkiMobile is a companion, not a full replacement, and that add-ons are not supported on the phone.',
          },
          {
            type: 'p',
            text: 'Zipdeck is a deck of fronts and backs, an optional hint, an optional picture, and a set to file it in. Study order is deck order, reverse, or random. That is the settings page. You will outgrow it if you want image occlusion, MathJax, or a deck of 100,000 cards. The App Store listing advertises decks of that size. Zipdeck is not trying to be that tool.',
          },
        ],
      },
      {
        id: 'when-zipdeck',
        heading: 'When Zipdeck is the better Anki',
        blocks: [
          {
            type: 'steps',
            items: [
              {
                title: 'The material has an order',
                text: 'A toast, a talk, and a scene fail if you only see random cards. Rehearse in Order walks the deck from the first card to the last and leaves your due dates alone.',
              },
              {
                title: 'The card should be the cue you will hear',
                text: 'The script preset puts the other person’s line on the front. Anki can store that shape. You have to build the note type. Zipdeck’s preset writes the prompt for you, and you still edit every card.',
              },
              {
                title: 'You want to hear it while your hands are busy',
                text: 'Listen plays a deck, a set, a mix, or a Language Studio scene, with a pause you can set in seconds. It does not update the schedule. Anki’s review session does, which is better for memory and worse for a run.',
              },
            ],
          },
          {
            type: 'p',
            text: 'Use both if you want. Anki for the course you will still be studying in two years. Zipdeck for the speech on Saturday and the phrases you want to say in a café. They do not sync with each other.',
          },
        ],
      },
    ],
    faqs: [
      {
        q: 'Is Zipdeck an Anki alternative?',
        a: 'For straightforward fronts and backs with SM-2, yes. It is not a replacement if you rely on FSRS, add-ons, shared Anki decks, image occlusion, or offline reviews that still update your schedule.',
      },
      {
        q: 'Does Zipdeck use the same algorithm as Anki?',
        a: 'Zipdeck uses SM-2. Anki uses SM-2 and can also use FSRS. The buttons are similar in spirit: a miss comes back soon, an easy card waits longer.',
      },
      {
        q: 'Can I import an Anki deck into Zipdeck?',
        a: 'Not as an Anki file. Export text and import a CSV with front and back columns. Review history does not come with it.',
      },
    ],
    sources: [
      { label: 'AnkiMobile on the US App Store', href: ANKI_IOS },
      { label: 'Anki FAQ, AnkiMobile pricing', href: ANKI_PRICE },
    ],
    notes: checked,
    related: ['best-flashcard-apps-2026', 'spaced-repetition', 'rehearse-in-order'],
  },
  {
    slug: 'zipdeck-vs-quizlet',
    category: 'comparisons',
    accent: '#ff6b57',
    mark: 'Free',
    plan: 'Comparison',
    title: 'Zipdeck vs Quizlet',
    seoTitle: 'Zipdeck vs Quizlet: What Stays Free in 2026',
    description:
      'How Zipdeck and Quizlet differ on Learn limits, ads, spaced repetition, export, and studying a speech or a language. Help-center sources included.',
    excerpt:
      'Quizlet is where the set already exists. Zipdeck is where Quiz, Write, and Match do not stop, and where a speech can be a deck.',
    lede: 'Quizlet is the library. Zipdeck is the daily study: Quiz, Write, and Match do not stop, there are no ads, and the schedule is in the apps.',
    sections: [
      {
        id: 'chart',
        heading: 'Where Zipdeck leads',
        blocks: [
          {
            type: 'chart',
            columns: [
              { name: 'Zipdeck', lead: true },
              { name: 'Quizlet' },
            ],
            rows: [
              {
                label: 'Quiz, Write, and Match with no round cap',
                cells: [
                  { mark: 'yes', text: 'Free, and they do not stop after a session' },
                  { mark: 'part', text: 'Learn is Plus, with a limited free try' },
                ],
              },
              {
                label: 'No ads',
                cells: [
                  { mark: 'yes', text: 'Free and Pro, website and apps' },
                  { mark: 'no', text: 'A 2026 review reports ads on the free plan' },
                ],
              },
              {
                label: 'Spaced repetition in the apps',
                cells: [
                  { mark: 'yes', text: 'SM-2 on the website and both apps' },
                  { mark: 'part', text: 'Inside Flashcards, on the website only' },
                ],
              },
              {
                label: 'Audio flashcards',
                cells: [
                  { mark: 'yes', text: 'Audio Review is free. Listen is on Pro.' },
                  { mark: 'part', text: 'A set can be read aloud' },
                ],
              },
              {
                label: 'AI Language Studio',
                cells: [
                  { mark: 'yes', text: 'Spoken scenes from A1 to C1, on Pro' },
                  { mark: 'no', text: 'No spoken-scene studio' },
                ],
              },
              {
                label: 'A set that already exists',
                cells: [
                  { mark: 'part', text: 'Sample Sets you copy. No one-click import.' },
                  { mark: 'yes', text: 'The public library people already share' },
                ],
              },
              {
                label: 'Price of the advanced plan',
                cells: [
                  { text: '$5.99 a month, or $39.99 a year' },
                  { text: 'Learn is Plus. Plus Unlimited removes the meters.' },
                ],
              },
            ],
          },
        ],
      },
      {
        id: 'study',
        heading: 'Study modes, and where the limit sits',
        blocks: [
          {
            type: 'p',
            text: [
              'The sourced row-by-row table lives on the ',
              { t: 'Quizlet alternative page', to: '/quizlet-alternative' },
              '. The short version: Zipdeck’s Flip, Quiz, Write Answer, Match, and Audio Review are free and uncapped. ',
              { t: 'Quizlet’s help center', h: QUIZLET_STUDY },
              ' says Learn is for Plus, with a limited free try. A later article calls that try ',
              { t: 'a free study session', h: QUIZLET_LEARN },
              '. Write is part of Learn, so typing the answer shares that limit. On Zipdeck, Write Answer is its own mode.',
            ],
          },
          {
            type: 'p',
            text: [
              { t: 'Test', h: QUIZLET_TEST },
              ' gives a free account one practice test per set. Zipdeck does not build a mixed exam from several decks. If a printable test is the point, Quizlet is further along. If the point is to keep quizzing the same deck until the terms stick, Zipdeck does not meter that.',
            ],
          },
        ],
      },
      {
        id: 'srs-ads',
        heading: 'Spaced repetition and ads',
        blocks: [
          {
            type: 'p',
            text: [
              'Quizlet’s ',
              { t: 'spaced-repetition help', h: QUIZLET_SRS },
              ' describes rating a card inside Flashcards, and it says the option is only on the website. Earlier reviews treated spaced repetition as a paid feature. The help center is the page to trust, and it can change again. Zipdeck’s SM-2 schedule is included on the web app and both mobile apps.',
            ],
          },
          {
            type: 'p',
            text: [
              'A ',
              { t: '2026 PCMag review', h: PCMAG },
              ' reports ads on Quizlet’s free plan. Zipdeck does not run ads on the free account or on Pro.',
            ],
          },
        ],
      },
      {
        id: 'library',
        heading: 'The library, and getting your cards out',
        blocks: [
          {
            type: 'p',
            text: 'Quizlet’s advantage is volume. If your class already shared a set, you should study that set where it is. Zipdeck’s Sample Sets are written as a catalog you can read on the web and copy into your account. They are not a mirror of Quizlet, and there is no one-click import.',
          },
          {
            type: 'p',
            text: [
              'If you created the Quizlet set, ',
              { t: 'their export article', h: QUIZLET_EXPORT },
              ' says you can copy the text. Save that as a CSV with front and back columns and import it. Images do not come across. Sets you copied from someone else cannot be exported from Quizlet. Your Zipdeck decks export as CSV — front, back, hint — and you can edit that file and import it back.',
            ],
          },
        ],
      },
      {
        id: 'more-than-terms',
        heading: 'What Quizlet is not trying to be',
        blocks: [
          {
            type: 'p',
            text: [
              'A best man speech, a scene, and a conversation are poor fits for a term-and-definition set. Zipdeck’s speech preset keeps order: previous sentence on the front, next sentence on the back, first letters as the hint. The script preset uses the cue line. Language Studio writes a short spoken scene at a level from A1 to C1. Those are Pro. The ',
              { t: 'feature guide', to: '/blog/zipdeck-features' },
              ' says which parts are free.',
            ],
          },
          {
            type: 'p',
            text: 'Quizlet is ahead on class games and on the sheer number of public sets. Zipdeck’s class tool is quieter: a 6-character code, each student gets their own copy, ratings stay on that copy. It is free. It is not a live classroom game.',
          },
        ],
      },
    ],
    faqs: [
      {
        q: 'Is Zipdeck a free Quizlet alternative?',
        a: 'For study, yes. Flip, Quiz, Write Answer, Match, Audio Review, and spaced repetition are free and unlimited, with no ads. You will not find Quizlet’s public library here, and there is no one-click import.',
      },
      {
        q: 'Can I move my Quizlet cards to Zipdeck?',
        a: 'If you created the set, copy the text, save a CSV with front and back columns, and import it. Images and other people’s sets do not export from Quizlet.',
      },
      {
        q: 'Does Quizlet Learn have a free limit?',
        a: 'Quizlet’s help center says Learn is for subscribers, and that a free account can try it for a limited number of rounds or a free session. Zipdeck Quiz and Write Answer do not have that cap.',
      },
    ],
    sources: [
      { label: 'Quizlet Help, Studying on Quizlet', href: QUIZLET_STUDY },
      { label: 'Quizlet Help, Studying with Learn', href: QUIZLET_LEARN },
      { label: 'Quizlet Help, Studying with Spaced Repetition', href: QUIZLET_SRS },
      { label: 'Quizlet Help, Studying with Test', href: QUIZLET_TEST },
      { label: 'Quizlet Help, Exporting your sets', href: QUIZLET_EXPORT },
      { label: 'PCMag, Quizlet review (2026)', href: PCMAG },
    ],
    notes: checked,
    related: ['best-flashcard-apps-2026', 'study-modes', 'share-a-deck-or-a-class'],
  },
]
