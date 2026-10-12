const nakataSpacing = {
  t: 'how much time you leave between reviews',
  h: 'https://www.cambridge.org/core/journals/studies-in-second-language-acquisition/article/abs/effects-of-expanding-and-equal-spacing-on-second-language-vocabulary-learning/D1D796306985C52F9BE7A1200AC50DB9',
}
const nakataThesis = {
  t: 'Nakata’s research on second-language flashcards',
  h: 'https://ir.wgtn.ac.nz/items/5278988f-b1f8-472a-8a79-774d9d5c6842/full',
}
const chineseSrs = {
  t: 'guides to spaced repetition for Mandarin',
  h: 'https://studycli.org/learn-chinese/spaced-repetition-for-learning-chinese/',
}
const toastmasters = {
  t: 'Toastmasters',
  h: 'https://toastmasters.org/magazine/magazine-issues/2020/nov/ditch-the-notecards',
}
const weddingNotes = {
  t: 'wedding-speech coaches',
  h: 'https://www.nailthespeech.com/advice/wedding-speech-notes',
}
const presentationRoute = {
  t: 'rehearsal guides for presenters',
  h: 'https://memorizespeech.com/guides/how-to-memorize-a-presentation',
}
const backstage = {
  t: 'Backstage',
  h: 'https://www.backstage.com/magazine/article/new-favorite-line-learning-technique-376/',
}
const offbook = {
  t: 'line-learning drills used by actors',
  h: 'https://www.offbook.com/for/theater-actors',
}

export const GUIDES = [
  {
    slug: 'chinese-flashcards',
    accent: '#4c6fff',
    nav: 'Chinese vocabulary',
    kicker: 'Mandarin',
    title: 'Chinese flashcards that teach the character, the sound, and the tone',
    lede: 'A useful Mandarin card asks for one skill. Characters on the front. Meaning, pinyin, and tones on the back. A second card makes you say the word. A third puts it in a short sentence.',
    description:
      'How to design Chinese flashcards for Mandarin vocabulary: one skill per card, characters without pinyin on the front, tones in real words, and spaced review.',
    seoTitle: 'Chinese Flashcards for Mandarin Vocabulary — Zipdeck',
    face: '谢谢',
    sampleHref: '/library/chinese',
    sampleLabel: 'Browse Chinese sample decks',
    cards: [
      {
        kind: 'See it',
        front: '谢谢',
        back: 'xièxie',
        backSub: 'Thank you',
        hint: 'Both syllables are tone 4: a sharp fall.',
      },
      {
        kind: 'Say it',
        front: 'Thank you',
        back: '谢谢',
        backSub: 'xièxie',
        hint: 'Say it aloud. The English side is the prompt, not a translation you read past.',
      },
      {
        kind: 'In a sentence',
        front: '谢谢你的帮助。',
        back: 'Xièxie nǐ de bāngzhù.',
        backSub: 'Thank you for your help.',
        hint: 'Tones are easier to hear inside a phrase than on a lone syllable.',
      },
    ],
    rules: [
      {
        title: 'Leave pinyin off the front',
        body: 'If the sound is already showing, you can “know” the card without reading 谢谢. The front is the characters. The back is the sound and the meaning.',
      },
      {
        title: 'One skill per card',
        body: 'Recognizing a word, saying it, and using it are different memories. A card that asks for all of them at once hides which one you missed.',
      },
      {
        title: 'Practice tones inside words',
        body: 'Mark the tones on the back, then review the word in a short sentence. Neighboring syllables change how a tone sounds.',
      },
    ],
    sections: [
      {
        heading: 'What a Chinese card is actually for',
        body: [
          [
            'Mandarin is a poor fit for a single “word / translation” card. You can recognize 谢谢 and still say the tones wrong. You can hear xièxie and still fail to read the characters. ',
            chineseSrs,
            ' treat those as separate recalls: see the characters and name the word, hear it and know the meaning, say it yourself, then meet it in a phrase.',
          ],
          [
            'That split matches what ',
            nakataThesis,
            ' found more generally. Receptive recall (see the foreign word, produce the meaning) and productive recall (see the meaning, produce the word) do not train the same thing. For Chinese, “produce the word” means the characters or the spoken form, not a pile of facts on one back.',
          ],
        ],
      },
      {
        heading: 'Why the reviews have to be spaced',
        body: [
          [
            nakataSpacing,
            ' changed retention more than whether those gaps grew or stayed even. Cramming a list of characters the night before a class feels fluent and fades. A deck that brings 谢谢 back after a day, then a few days, then longer, is the schedule Nakata’s vocabulary studies keep pointing at.',
          ],
          [
            'Start from words you have already met, not from a thousand isolated syllables. Zipdeck’s ',
            { t: 'Chinese sample decks', to: '/library/chinese' },
            ' are everyday phrases — greetings, numbers, survival lines — so the first cards are things you can say to a person.',
          ],
        ],
      },
    ],
    sources: [
      { label: 'Nakata, expanding and equal spacing (Studies in Second Language Acquisition)', href: nakataSpacing.h },
      { label: 'Nakata, optimising vocabulary learning from flashcards (Victoria University of Wellington)', href: nakataThesis.h },
      { label: 'Chinese Language Institute, spaced repetition for Mandarin', href: chineseSrs.h },
    ],
  },
  {
    slug: 'wedding-speech',
    accent: '#ff6b57',
    nav: 'A wedding speech',
    kicker: 'A toast',
    title: 'Memorize a wedding speech without reading it off the page',
    lede: 'Learn the first lines and the toast word for word. Turn the stories in the middle into a handful of cue cards. Guests remember eye contact, not a perfect script.',
    description:
      'How to memorize a wedding speech with flashcards: learn the opening and the toast verbatim, and cue the stories in between so you speak instead of read.',
    seoTitle: 'How to Memorize a Wedding Speech with Flashcards — Zipdeck',
    face: 'Raise a glass',
    cards: [
      {
        kind: 'Opening, word for word',
        front: 'How you start',
        back: 'I have known Maya since we were seventeen, and I have never seen her look at anyone the way she looks at Jordan.',
        hint: 'Say this with your eyes up. The card is a backup, not the script you read.',
      },
      {
        kind: 'A story, as a cue',
        front: 'The middle',
        back: 'Rainy picnic',
        backSub: 'The blanket, the wrong park, Jordan’s coat.',
        hint: 'One glance should be enough. If the card is a paragraph, you will read it.',
      },
      {
        kind: 'The toast, word for word',
        front: 'How you end',
        back: 'To Maya and Jordan — may the ordinary Tuesdays be as good as today.',
        hint: 'Number this card. The close is the line the room keeps.',
      },
    ],
    rules: [
      {
        title: 'Memorize the ends, cue the middle',
        body: 'The first half-minute and the toast are worth word-for-word. The stories only need a trigger: a place, a year, a joke you already know how to tell.',
      },
      {
        title: 'One beat per card',
        body: 'Four to six cards cover a short toast: open, first story, what it showed, turn to the couple, wish, glass. A full page becomes a script you hide behind.',
      },
      {
        title: 'Rehearse out loud',
        body: 'Read the cue, look up, and say the beat. Silent reading makes the speech feel familiar. Speaking is what you will actually do in the room.',
      },
    ],
    sections: [
      {
        heading: 'Why a full script fights you',
        body: [
          [
            weddingNotes,
            ' and working toast writers keep landing on the same shape. A printed speech pulls your eyes down. A phone does the same thing, with a scroll. A few stiff cards with large type can be glanced at between sentences, then ignored.',
          ],
          [
            'The example above is a made-up toast, so you can see the card design without borrowing someone else’s speech. Yours should be just as short on the card: the opening sentence in full, then “rainy picnic,” then the toast in full.',
          ],
        ],
      },
      {
        heading: 'What to practice, and what to leave alone',
        body: [
          [
            toastmasters,
            ' puts it as “don’t memorize, internalize,” a line the magazine traces to the 2001 World Champion of Public Speaking, Darren LaCroix. Their rehearsal is: say a chunk aloud, try it without looking, check, then move on. Memorizing every sentence makes a blank worse, because the next word depends on the one you lost.',
          ],
          [
            'Number the cards. If you drop them, the order is how you recover. Leave the closing line on its own card and do not look at it while you say it.',
          ],
        ],
      },
    ],
    sources: [
      { label: 'Toastmasters, “Ditch the Notecards”', href: toastmasters.h },
      { label: 'Nail the Speech, notes for a wedding speech', href: weddingNotes.h },
    ],
  },
  {
    slug: 'business-presentation',
    accent: '#f2b84b',
    nav: 'A presentation',
    kicker: 'At work',
    title: 'Memorize a business presentation without reading your slides',
    lede: 'Slides are not the script. Each card holds the point of a section, the number you must not round, and the sentence that takes you to the next one.',
    description:
      'How to memorize a business presentation with flashcards: one card per section, exact figures on the back, and the opening and the ask rehearsed out loud.',
    seoTitle: 'How to Memorize a Business Presentation — Zipdeck',
    face: 'Approve the pilot',
    cards: [
      {
        kind: 'The opening',
        front: 'First 20 seconds',
        back: 'The pilot cut onboarding from 19 days to 8. That is the decision.',
        hint: 'Start from silence. No “so, um, thanks for making the time.”',
      },
      {
        kind: 'The number',
        front: 'Where the cost sits',
        back: '$240,000 a year',
        backSub: 'Overtime. Not licenses.',
        hint: 'Exact figures go on the card. Paraphrase the story around them.',
      },
      {
        kind: 'The ask',
        front: 'Last 20 seconds',
        back: 'Approve the six-week pilot. We report on the 12th.',
        hint: 'Stop when the sentence stops. Do not add “that’s basically it.”',
      },
    ],
    rules: [
      {
        title: 'Write the job of the section, not the paragraph',
        body: '“Show that the cost is overtime” is a card. The three bullets you were going to read off the slide are not.',
      },
      {
        title: 'Protect the numbers',
        body: 'Stories can flex. A dollar figure, a date, and a name should be exact. Put those on the back and recall them, don’t round them in the room.',
      },
      {
        title: 'Drill the open, the handoffs, and the ask',
        body: 'The middle is the material you already know. The room decides at the start, at each transition, and at the close.',
      },
    ],
    sections: [
      {
        heading: 'A deck is a route, not a teleprompter',
        body: [
          [
            presentationRoute,
            ' describe the same cut: reduce the talk to the opening, each point, the proof, and the decision you want. Then speak from those cues while the slide stays a visual, not a script.',
          ],
          [
            'The cards here are a fictional staffing pilot, so the shape is easy to copy. Your front is the question the section answers. Your back is the line you want available under pressure, especially the figure you would hate to get wrong.',
          ],
        ],
      },
      {
        heading: 'Rehearse the parts that actually fail',
        body: [
          [
            'Running the whole deck in a whisper trains the part you were never going to forget. Say the opening from silence, once, then the single sentence that hands you from one section to the next, then the ask. Stand up. Use the clicker if you will have one.',
          ],
          [
            'When a line drops, pause and return to the point of the card. Colleagues came for the decision, not for a recital. A card you can recall is what lets you paraphrase without losing the number.',
          ],
        ],
      },
    ],
    sources: [
      { label: 'Memorize Speech, memorizing a presentation without reading slides', href: presentationRoute.h },
    ],
  },
  {
    slug: 'script-lines',
    accent: '#3fcf8e',
    nav: 'Script lines',
    kicker: 'For actors',
    title: 'Memorize script lines from the cue, not from the page',
    lede: 'In the room, nobody hands you your line. They hand you the line before it. Put that cue on the front of the card and your answer on the back, then say it out loud.',
    description:
      'How actors memorize script lines with flashcards: the other character’s cue on the front, your line on the back, plus a first-letter card when the wording has to be exact.',
    seoTitle: 'How Actors Memorize Script Lines with Flashcards — Zipdeck',
    face: 'Your cue',
    cards: [
      {
        kind: 'Cue, then your line',
        front: 'I didn’t think it polite to listen, sir.',
        frontNote: 'Lane',
        back: 'I’m sorry for that, for your sake. I don’t play accurately — any one can play accurately — but I play with wonderful expression.',
        backSub: 'Algernon',
        hint: 'Oscar Wilde, The Importance of Being Earnest. The apology is a joke.',
      },
      {
        kind: 'First letters',
        front: 'I s f t, f y s.',
        back: 'I’m sorry for that, for your sake.',
        hint: 'Letters are too little to read and enough to find the wording. Then drop them.',
      },
      {
        kind: 'The intention',
        front: 'What does he want?',
        back: 'To wave the insult away and show off.',
        hint: 'If the words go, the want brings them back. Actors who only store the sentence cannot recover.',
      },
    ],
    rules: [
      {
        title: 'The front is the other person’s line',
        body: 'Cover your own text. Hear or read the cue, then answer. A line you can only recall by looking at it will be late when the cue arrives.',
      },
      {
        title: 'Step down to less ink',
        body: 'Full line, then the first letter of each word, then nothing. Backstage’s notecard method is this ladder. You are done when the cue alone is enough.',
      },
      {
        title: 'Keep the want on a card too',
        body: 'A one-line paraphrase — charm her, back off, show off — is how you find the speech again after a blank. Exact words matter. So does knowing why you say them.',
      },
    ],
    sections: [
      {
        heading: 'Lines stick to the cue that triggers them',
        body: [
          [
            offbook,
            ' start from the same place as a working rehearsal: read the cue aloud, cover your line, say it, check. The Wilde exchange above is public domain, and it is a clean demo. Lane’s politeness is the trigger. Algernon’s fake apology is the response. If you only drill Algernon’s sentence by itself, you have learned a quote, not an entrance.',
          ],
          [
            backstage,
            ' describes the pocket version: the full line on one side of a card, the first letters on the other, carried and tested in spare minutes. Add the cue once the words are close. A line you cannot place in the scene will step on the actor opposite you.',
          ],
        ],
      },
      {
        heading: 'Say it. Don’t reread it.',
        body: [
          [
            'Familiar ink feels like memory. On stage you produce the line from what you just heard, at the pace of the scene, without pausing the other person so you can “get ready.” Record the cues if you have no reader, leave a real beat, and answer without stopping the audio.',
          ],
          [
            'Work one scene, then keep the earlier scenes in the deck so they don’t fade while you learn the next. Mark the cues you miss and review those, not the lines that already come out clean.',
          ],
        ],
      },
    ],
    sources: [
      { label: 'Offbook, learning lines for a play', href: offbook.h },
      { label: 'Backstage, a notecard line-learning technique', href: backstage.h },
      { label: 'Oscar Wilde, The Importance of Being Earnest (public domain)', href: 'https://www.gutenberg.org/ebooks/844' },
    ],
  },
]

export function guideBySlug(slug) {
  return GUIDES.find((guide) => guide.slug === slug) || null
}
