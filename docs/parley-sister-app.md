# Parley — sister app concept (working name)

**Parley** = language learning through generated conversations you rehearse and remember.  
Flashcards are a secondary study tool (vocab extracted from fully learned scenes), not the home screen.

Temporary name only. Replace before store listing.

Mockups (phone, daylight teal — not Zipdeck dark cobalt):

- `../.cursor/projects/c-flashcards/assets/parley-home.jpg` — Home / continue
- `../.cursor/projects/c-flashcards/assets/parley-scenes.jpg` — Scene library
- `../.cursor/projects/c-flashcards/assets/parley-create.jpg` — New scene
- `../.cursor/projects/c-flashcards/assets/parley-practice.jpg` — Practice a turn

(On this machine they live under the Cursor project assets folder.)

---

## Product shape

| Zipdeck | Parley |
| --- | --- |
| Decks, SM-2, Create With AI, Listen as features among many | Scenes are the product |
| Web + Android + iOS | Phone apps first (Capacitor + Ionic UI ok); marketing site only |
| Language Studio is one Pro module | Language Studio APIs are the core backend |
| Flashcards primary | Flashcards later, from learned-scene vocab |

Main loop: **pick pair → generate or open scene → practice → listen → rate → fully learned feeds next generate**.

---

## Recommended build approach

### 1. Same server, new client

Keep one Spring Boot + MySQL (Lightsail). Do **not** fork the Language Studio / agent / billing / auth code into a second API.

New Capacitor app (separate frontend package or repo):

- `VITE_API_BASE=https://api.zipdeck.app` at first, or later `https://api.parley.app` as a DNS/CNAME to the same API
- Send a product header on every request, e.g. `X-App: parley`
- Bundle ID / package: `app.parley` (or similar), **not** `com.zipdeck.app` — stores and IAP need a distinct app

Zipdeck web can keep shipping Language Studio; Parley is a different shell over the same scene APIs.

### 2. Users: shared identity, product-scoped membership

Best default for you:

- **One `users` table** (same Google / email login)
- New table (or columns) for **which products** the account belongs to: `ZIPDECK`, `PARLEY`
- First open of Parley creates a Parley membership row; Zipdeck stays unchanged
- Optional later: “Link accounts” if someone signed up twice

Avoid fully separate user tables unless you need hard privacy/commerce isolation. Duplicate Google accounts and support load are worse than a membership flag.

### 3. Entitlements / Pro: product-scoped

Do not treat “Zipdeck Pro” as “Parley Pro”.

- Scope subscriptions and credits by product (`provider` + `product` / separate price IDs)
- Play Billing and App Store are **per app** anyway — new package, new products (`parley_monthly`, etc.)
- Website Stripe (if Parley ever sells on web) gets its own products; native stays store billing

Studio generate credits can share ledger code with a `product` column, or a separate credit pool — decide before public launch.

### 4. API surface Parley needs on day one

Already in Zipdeck:

- `/api/language-studio/**` — pairs, generate job, conversations, rate, samples, listen source
- Auth (Google + email), account basics
- TTS / Listen queue patterns if reused

Defer or hide in Parley v1:

- Decks / groups / classes / Create With AI decks
- Zipdeck marketing / SEO web shell

Later:

- Vocab extract from `LEARNED` scenes → optional SM-2 deck inside Parley

### 5. Frontend strategy

- **New app shell**, Ionic components ok here (Zipdeck stayed web-first Capacitor without Ionic; Parley can be Ionic-first)
- Phone UX first: bottom tabs, large resume CTA, one job per screen
- Do not clone Zipdeck CSS variables / dark cobalt UI
- Shared TypeScript API client possible as a small package; UI components should not be shared 1:1

### 6. Suggested phases

1. **Spike** — Capacitor Ionic blank app, login against prod/staging API, list conversations + practice one scene  
2. **Product gate** — `X-App: parley` + membership + Parley-only Pro stub/allowlist  
3. **Core loop** — Home, Scenes, New scene, Practice, Listen, Rate (mockups below)  
4. **Store shells** — separate Play / App Store listings, IAP products  
5. **Secondary flashcards** — vocab from fully learned scenes  

---

## User segregation options (summary)

| Option | Pros | Cons |
| --- | --- | --- |
| **A. Shared users + product membership** (recommended) | One login, shared studio data if you want, least duplicate code | Must scope Pro/credits carefully |
| **B. Shared users, separate conversation tables by product** | Cleaner product analytics | More schema work; still one identity |
| **C. Separate user tables, same DB** | Harder to leak Zipdeck Pro into Parley | Two accounts for one person; linking pain |
| **D. Separate API + DB** | Total isolation | Forks Language Studio forever — avoid |

Recommendation: **A**, with conversations either shared under the user (simplest) or tagged `product=PARLEY` if you want Zipdeck Studio and Parley libraries to stay visually separate for the same person.

---

## Design direction used in mockups

Working visual system for Parley (deliberately not Zipdeck):

- Daylight cool paper `#F2F5F7`, charcoal text  
- Deep teal `#0B5C5C` primary  
- Soft teal tint on “You” bubbles  
- Serif wordmark, calm spacing, bottom tabs  
- Filters look like filters (labeled select), not stacked action buttons  

Screens mocked: Home, Scenes, New scene, Practice.
