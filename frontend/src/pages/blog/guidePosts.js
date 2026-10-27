const toastmasters = 'https://toastmasters.org/magazine/magazine-issues/2020/nov/ditch-the-notecards'
const weddingNotes = 'https://www.nailthespeech.com/advice/wedding-speech-notes'
const chineseSrs = 'https://studycli.org/learn-chinese/spaced-repetition-for-learning-chinese/'
const backstage = 'https://www.backstage.com/magazine/article/new-favorite-line-learning-technique-376/'
const offbook = 'https://www.offbook.com/for/theater-actors'
const wilde = 'https://www.gutenberg.org/ebooks/844'

export const guidePosts = [
  {
    slug: 'memorize-a-best-man-speech',
    category: 'guides',
    accent: '#ff6b57',
    mark: 'Toast',
    plan: 'Guide',
    title: 'Memorize a best man speech',
    seoTitle: 'How to Memorize a Best Man Speech with Flashcards',
    description:
      'Use flashcards to learn a best man speech: opening and toast word for word, stories as cues, then rehearse in order out loud.',
    excerpt:
      'The room remembers your eyes, not your wording. Learn the open and the toast. Cue the stories. Stop reading.',
    lede: 'A best man speech fails in two directions. Read it, and you disappear into the page. Memorize every sentence, and one blank takes the rest of the toast with it. The workable shape is short: a few lines word for word, and a handful of cues for the stories.',
    sections: [
      {
        id: 'cards',
        heading: 'What goes on the card',
        blocks: [
          {
            type: 'cards',
            cards: [
              {
                kind: 'Opening',
                front: 'How you start',
                back: 'I have known Sam since we were seventeen, and I have never seen him look at anyone the way he looks at Priya.',
                hint: 'Say this with your eyes up. The card is a backup.',
              },
              {
                kind: 'A story',
                front: 'The middle',
                back: 'The wrong train',
                hint: 'One glance. If the card is a paragraph, you will read it.',
              },
              {
                kind: 'The toast',
                front: 'How you end',
                back: 'To Sam and Priya. May the ordinary Tuesdays be as good as today.',
                hint: 'This line is worth word for word. Do not look down while you say it.',
              },
            ],
          },
          {
            type: 'p',
            text: [
              'Four to six cards cover a short toast: open, first story, what it showed about the couple, a second beat if you need one, the turn toward them, the glass. A roast stays kind because the card will not save a joke you cannot tell cleanly. If you need the wording exact, it belongs on the back in full. If you only need the memory, one phrase is enough. The ',
              { t: 'card-design guide', to: '/memorize/wedding-speech' },
              ' is the shorter version of this idea, with the sources speech coaches actually use.',
            ],
          },
        ],
      },
      {
        id: 'week',
        heading: 'The week of the wedding, in Zipdeck',
        blocks: [
          {
            type: 'steps',
            items: [
              {
                title: 'Draft the cards with the speech preset',
                text: 'Create with AI, Pro, can take the speech as a file or as pasted text. The preset keeps order: previous sentence on the front, next sentence on the back, first letter of each word as the hint. Then delete the sentences you do not need verbatim. A story becomes one cue card. Leaving every sentence in is how you end up reading.',
              },
              {
                title: 'Rehearse in Order, out loud',
                text: 'This walks the deck from the first card to the last and does not change your other reviews. Stand up. Look up between cards. Silent reading is how the speech feels ready and then is not.',
              },
              {
                title: 'Listen once on the way',
                text: 'Listen can play the deck in the car. Set a real pause so you say the line before you hear it. Listening does not replace the out-loud rehearsal. It is the extra pass when your hands are on a steering wheel.',
              },
              {
                title: 'Mark the line you dropped',
                text: 'After rehearsal, rate that card Missed in Flip. SM-2 will bring it back. Rehearse alone will not.',
              },
            ],
          },
          {
            type: 'p',
            text: [
              { t: 'Toastmasters', h: toastmasters },
              ' has argued for years that a full recital makes a blank worse, because the next word depends on the one you lost. ',
              { t: 'Wedding-speech coaches', h: weddingNotes },
              ' keep landing on the same shape: glance, then eyes up. Number the cards. If you drop them, the order is how you recover.',
            ],
          },
        ],
      },
    ],
    faqs: [
      {
        q: 'How do you memorize a best man speech?',
        a: 'Learn the opening and the toast word for word. Turn each story into a short cue. Rehearse out loud in order, and do not read the middle off a page.',
      },
      {
        q: 'Can Zipdeck turn a speech into flashcards?',
        a: 'Yes, with Pro. The speech preset builds one card per sentence, in order, with a first-letter hint. You should delete any sentence you only need as a cue.',
      },
    ],
    sources: [
      { label: 'Toastmasters, “Ditch the Notecards”', href: toastmasters },
      { label: 'Nail the Speech, notes for a wedding speech', href: weddingNotes },
    ],
    related: ['create-decks-with-ai', 'rehearse-in-order', 'memorize-a-presentation'],
  },
  {
    slug: 'learn-chinese-with-flashcards',
    category: 'guides',
    accent: '#4c6fff',
    mark: '谢谢',
    plan: 'Guide',
    title: 'Start learning Chinese with flashcards',
    seoTitle: 'Chinese Flashcards: Characters, Pinyin, and Tones',
    description:
      'A practical way to start Mandarin with flashcards: one skill per card, characters without pinyin on the front, then a short spoken scene.',
    excerpt:
      'A single “word / translation” card hides which part you missed: the character, the sound, or the tone.',
    lede: 'Mandarin punishes a lazy card. You can recognize 谢谢 and still say the tones wrong. You can hear xièxie and still fail to read it. Split the skills. Then put the word in a sentence you might actually say.',
    sections: [
      {
        id: 'three-cards',
        heading: 'Three cards, not one crowded card',
        blocks: [
          {
            type: 'cards',
            cards: [
              {
                kind: 'Read it',
                front: '谢谢',
                back: 'xièxie',
                hint: 'Thank you. Both syllables are a sharp falling tone.',
              },
              {
                kind: 'Say it',
                front: 'Thank you',
                back: '谢谢',
                hint: 'The English is the prompt. You produce the word.',
              },
              {
                kind: 'Use it',
                front: '谢谢你的帮助。',
                back: 'Xièxie nǐ de bāngzhù.',
                hint: 'Thank you for your help. Tones are easier inside a phrase.',
              },
            ],
          },
          {
            type: 'p',
            text: [
              'Leave pinyin off the front of the reading card. If the sound is already showing, you can “know” 谢谢 without reading it. The ',
              { t: 'longer card guide', to: '/memorize/chinese-flashcards' },
              ' goes into why receptive recall and productive recall are different memories. ',
              { t: 'Guides to spaced repetition for Mandarin', h: chineseSrs },
              ' make the same split: see it, hear it, say it, meet it in a phrase.',
            ],
          },
        ],
      },
      {
        id: 'first-week',
        heading: 'A first week that is not a thousand syllables',
        blocks: [
          {
            type: 'steps',
            items: [
              {
                title: 'Copy a sample deck',
                text: 'The Chinese sample decks are everyday phrases: greetings, numbers, getting around. Read them on the web, then copy one into your account. Start from words you can say to a person.',
              },
              {
                title: 'Study in both directions',
                text: 'Flip the characters first. Write Answer when you are ready to produce pinyin or the characters from English. Quiz is only a warm-up. You can recognize a tone diagram and still say it flat.',
              },
              {
                title: 'Hear it on a walk',
                text: 'Listen can play the deck with a pause long enough to attempt the tones. It will not fix a tone you have never checked against a recording, and it does not update your schedule. Sit down with Audio Review or Write for the cards that count.',
              },
              {
                title: 'Add one scene',
                text: 'Language Studio can write a short café or hotel conversation at A1 or A2. Say your line before you reveal it. A scene is where a word you “knew” on a card goes missing. That is the information.',
              },
            ],
          },
          {
            type: 'p',
            text: 'Pictures help for nouns you can point at. They do nothing for a tone. Do not put a photo of a person bowing on the same card as the only practice for xièxie and call the tones done.',
          },
        ],
      },
    ],
    faqs: [
      {
        q: 'How should Chinese flashcards be set up?',
        a: 'One skill per card. Characters on the front, pinyin and meaning on the back. A second card asks you to say the word from English. A third puts it in a short sentence.',
      },
      {
        q: 'Does Zipdeck have Chinese decks?',
        a: 'Yes. Sample Sets include Chinese decks you can read free and copy into your account. Language Studio can also generate a spoken scene at a beginner level.',
      },
    ],
    sources: [
      { label: 'Chinese Language Institute, spaced repetition for Mandarin', href: chineseSrs },
    ],
    related: ['language-studio', 'study-modes', 'learn-a-language-on-a-walk'],
  },
  {
    slug: 'learn-lines-for-a-play',
    category: 'guides',
    accent: '#3fcf8e',
    mark: 'Cue',
    plan: 'Guide',
    title: 'Learn your lines for a play',
    seoTitle: 'How Actors Learn Lines with Flashcards',
    description:
      'Memorize a play by putting the other character’s cue on the front of the card and your line on the back. Then rehearse in order out loud.',
    excerpt:
      'Nobody hands you your line on stage. They hand you the line before it. That line is the front of the card.',
    lede: 'Lines stick to the cue that triggers them. If you drill your sentence by itself, you have learned a quote. In the room you have to answer the person opposite you, at their pace, without a page.',
    sections: [
      {
        id: 'cue',
        heading: 'The front of the card is their line',
        blocks: [
          {
            type: 'cards',
            cards: [
              {
                kind: 'Cue',
                front: 'I didn’t think it polite to listen, sir.',
                frontNote: 'Lane',
                back: 'I’m sorry for that, for your sake.',
                hint: 'Algernon. Oscar Wilde. The apology is a joke. Cover your own text.',
              },
              {
                kind: 'First letters',
                front: 'I s f t, f y s.',
                back: 'I’m sorry for that, for your sake.',
                hint: 'Too little to read. Enough to find the wording. Then drop the letters.',
              },
              {
                kind: 'The want',
                front: 'What does he want?',
                back: 'To wave the insult away and show off.',
                hint: 'If the words go, the intention is how you find them.',
              },
            ],
          },
          {
            type: 'p',
            text: [
              'The Wilde exchange is public domain, and it is a clean demo: politeness in, a fake apology out. ',
              { t: 'Line-learning drills', h: offbook },
              ' start from the same place. ',
              { t: 'Backstage’s notecard method', h: backstage },
              ' is the ladder: full line, then first letters, then nothing. The ',
              { t: 'shorter guide', to: '/memorize/script-lines' },
              ' stays on that ladder. This page is the Zipdeck version of the week you have a scene to learn.',
            ],
          },
        ],
      },
      {
        id: 'workflow',
        heading: 'From sides to off-book',
        blocks: [
          {
            type: 'steps',
            items: [
              {
                title: 'Run the script preset on your role',
                text: 'Create with AI takes a PDF, a Word file, or pasted text. Name the character. The front becomes the cue, the back becomes your line, the hint becomes first letters. Read it against the script. The preset is told not to invent dialogue. Check that it did not.',
              },
              {
                title: 'Rehearse in Order for the scene',
                text: 'Walk the cues in scene order, out loud. This does not touch your review schedule. A partner reading the other role is better than the app. The app is what you have at midnight.',
              },
              {
                title: 'Record the cues if you are alone',
                text: 'Listen can play the fronts if you build a deck of cues, but a scene partner’s recording is better because the timing is human. Leave a real beat and answer without pausing them.',
              },
              {
                title: 'Keep earlier scenes in the deck',
                text: 'New pages push old pages out. A Study Mix, or simply not deleting act 1, is how act 1 is still there at the run. Rate the cues you miss. Do not keep drilling the lines that already come out clean.',
              },
            ],
          },
        ],
      },
    ],
    faqs: [
      {
        q: 'How do actors memorize lines with flashcards?',
        a: 'Put the other character’s cue on the front and your line on the back. Step down to first letters, then to nothing. Say it out loud. Add a card for what the character wants if the words drop.',
      },
      {
        q: 'Can Zipdeck make cue cards from a script?',
        a: 'Yes, with Pro. The script preset builds cue-and-line cards for one character and keeps scene order. You still check every line against the script.',
      },
    ],
    sources: [
      { label: 'Offbook, learning lines for a play', href: offbook },
      { label: 'Backstage, a notecard line-learning technique', href: backstage },
      { label: 'Oscar Wilde, The Importance of Being Earnest (public domain)', href: wilde },
    ],
    related: ['prepare-an-acting-audition', 'create-decks-with-ai', 'rehearse-in-order'],
  },
  {
    slug: 'prepare-an-acting-audition',
    category: 'guides',
    accent: '#f2b84b',
    mark: 'Side',
    plan: 'Guide',
    title: 'Prepare an acting audition',
    seoTitle: 'How to Learn Audition Sides with Flashcards',
    description:
      'Learn audition sides fast: cue on the front, your line on the back, the intention on its own card, and a run-through in order the morning of.',
    excerpt:
      'Sides arrive late and they are short. The reader’s line is the cue. Your job is to answer it like you have known it longer than you have.',
    lede: 'An audition is a play you learn overnight. The sides are short, the reader is not your scene partner from rehearsal, and you will not get a second pass at a line you can only find by looking down. Build the cards around their cue and your intention. Then run the order until the paper can stay in the bag.',
    sections: [
      {
        id: 'sides',
        heading: 'Sides are not the whole play',
        blocks: [
          {
            type: 'p',
            text: 'Do not card the reader’s lines as if they were yours. Their line is the front. Yours is the back. If a stage direction is the only cue — they turn, the phone rings — write that direction as the front. A card that starts with your own sentence trains you to start before they have finished.',
          },
          {
            type: 'cards',
            cards: [
              {
                kind: 'Their cue',
                front: 'You said you’d be here at eight.',
                back: 'I said I’d try. That’s not the same sentence.',
                hint: 'Say it to a person, not to the page.',
              },
              {
                kind: 'Intention',
                front: 'What do you want?',
                back: 'To stop the fight without apologizing.',
                hint: 'If the wording slips, play the want. Do not stop the scene to search.',
              },
            ],
          },
          {
            type: 'p',
            text: 'A monologue has no other speaker. Use the previous sentence as the cue, the same shape as a speech. The first card’s front can say “Start.” The intention card still matters. Auditors can hear a memorized paragraph that has no aim.',
          },
        ],
      },
      {
        id: 'morning',
        heading: 'The night before, and the morning of',
        blocks: [
          {
            type: 'steps',
            items: [
              {
                title: 'Tonight: preset, then cut',
                text: 'If the sides are a file, the script preset drafts cue cards for your role. Read every line against the PDF. Cut nothing that is yours. Add the intention card by hand. AI will not know what you want the moment to do.',
              },
              {
                title: 'Tonight: three passes out loud',
                text: 'Rehearse in Order. First pass with the words. Second pass with first-letter hints only, if you have them. Third pass looking up, even if you have to pause. A pause is allowed. A glance down for a whole line is the habit you are trying not to walk in with.',
              },
              {
                title: 'Morning: one clean run, then stop',
                text: 'One rehearsal, not ten. Ten is how you sand the life off it. Listen in the car only if you still answer during the pause. Hearing yourself reciting is not the same as answering a reader.',
              },
            ],
          },
          {
            type: 'p',
            text: [
              'The ',
              { t: 'play guide', to: '/blog/learn-lines-for-a-play' },
              ' is the longer version for a full role. Audition prep is the same cue, on a shorter clock. ',
              { t: 'Backstage’s letter method', h: backstage },
              ' still applies when you only have twelve lines. It just takes an hour instead of a week.',
            ],
          },
        ],
      },
    ],
    faqs: [
      {
        q: 'How do you memorize audition sides quickly?',
        a: 'Put the reader’s line on the front and yours on the back. Add a card for what you want. Run the scene in order out loud a few times, then stop. Do not drill it into a flat recital.',
      },
      {
        q: 'Should I memorize the reader’s lines?',
        a: 'Know them well enough to hear the cue. Do not store them as lines you are about to say. The card front is the cue. The back is the only line you perform.',
      },
    ],
    sources: [{ label: 'Backstage, a notecard line-learning technique', href: backstage }],
    related: ['learn-lines-for-a-play', 'rehearse-in-order', 'create-decks-with-ai'],
  },
  {
    slug: 'memorize-a-presentation',
    category: 'guides',
    accent: '#f2b84b',
    mark: 'Q3',
    plan: 'Guide',
    title: 'Memorize a presentation without reading the slides',
    seoTitle: 'How to Memorize a Presentation with Flashcards',
    description:
      'Learn a work presentation from cue cards: one card per section, exact figures on the back, and the opening and the ask rehearsed out loud.',
    excerpt:
      'The slide is the picture. The card is the point, the number you must not round, and the sentence that moves you on.',
    lede: 'Slides are not the script. If the sentence is on the slide, the room can read it faster than you can say it. Put the job of each section on a card, protect the numbers, and rehearse the opening and the ask until they survive nerves.',
    sections: [
      {
        id: 'shape',
        heading: 'One card per move, not per bullet',
        blocks: [
          {
            type: 'cards',
            cards: [
              {
                kind: 'Open',
                front: 'First 20 seconds',
                back: 'The pilot cut onboarding from 19 days to 8. That is the decision.',
                hint: 'Start from the point. Skip the thank-you paragraph.',
              },
              {
                kind: 'The number',
                front: 'Where the cost sits',
                back: '$240,000 a year',
                hint: 'Overtime, not licenses. Exact. Do not round it in the room.',
              },
              {
                kind: 'The ask',
                front: 'Last 20 seconds',
                back: 'Approve the six-week pilot. We report on the 12th.',
                hint: 'Stop when the sentence stops.',
              },
            ],
          },
          {
            type: 'p',
            text: [
              'The example is a fictional staffing pilot, so you can see the shape. Stories can flex. A dollar figure, a date, and a name should not. The ',
              { t: 'presentation guide', to: '/memorize/business-presentation' },
              ' stays on that cut: opening, point, proof, decision.',
            ],
          },
        ],
      },
      {
        id: 'rehearse',
        heading: 'Rehearse the parts that actually fail',
        blocks: [
          {
            type: 'p',
            text: 'Whispering the whole deck trains the middle, which you were never going to forget. Say the opening from silence. Say the one sentence that hands you from this slide to the next. Say the ask. Stand up. Use the clicker if you will have one. Rehearse in Order if you want the app to refuse to shuffle.',
          },
          {
            type: 'p',
            text: 'When a line drops, return to the point of the card and paraphrase. Colleagues came for the decision. A card you can recall is what lets you paraphrase without losing the number. Rate that number-card Missed afterward so it comes back before the meeting, not only during it.',
          },
          {
            type: 'callout',
            title: 'Do not Listen your way through the slides',
            text: 'Hearing the deck in your headphones the hour before is fine as a last pass. It will not tell you that you are still looking at the screen. One standing rehearsal will.',
          },
        ],
      },
    ],
    faqs: [
      {
        q: 'How do you memorize a presentation?',
        a: 'One card per section: the point, the exact figure, and the sentence that moves you to the next slide. Rehearse the opening, the handoffs, and the ask out loud. Let the middle stay in your own words.',
      },
      {
        q: 'Should I read from the slides?',
        a: 'No. If the room needed the paragraph, it could read the paragraph. The slide stays a visual. The card holds the line you would hate to get wrong.',
      },
    ],
    related: ['memorize-a-best-man-speech', 'rehearse-in-order', 'flashcards-for-exams'],
  },
  {
    slug: 'flashcards-for-exams',
    category: 'guides',
    accent: '#7c6cff',
    mark: 'Exam',
    plan: 'Guide',
    title: 'Use flashcards for an exam',
    seoTitle: 'Flashcards for Exams: Recall, Mix, and What to Skip',
    description:
      'How to study for an exam with flashcards: cloze from notes, Write for rules you must say, pictures for diagrams, and a mix so early chapters do not vanish.',
    excerpt:
      'A deck of highlighted sentences is not a practice exam. A blank where the rule should be is closer.',
    lede: 'Flashcards are a poor way to learn a subject the first time and a strong way to keep a fact you already understand. For an exam, that means cards made from notes you have already read, studied in the mode that matches the question, and mixed so week 1 is still there in week 8.',
    sections: [
      {
        id: 'make',
        heading: 'Make cards from the thing the exam will ask',
        blocks: [
          {
            type: 'steps',
            items: [
              {
                title: 'Cloze the sentence, do not copy the highlight',
                text: 'The front is a sentence with the key term blank. The back is the term. If the front contains the answer, you are reading, not recalling. The cloze preset does this from a PDF or from pasted notes. Check that it did not leave the answer on the front.',
              },
              {
                title: 'One fact per card',
                text: 'A card titled “elements of negligence” with four bullets on the back is a list you will half-remember. Four cards, or four clozes, tell you which element you lost.',
              },
              {
                title: 'Match the mode to the exam',
                text: 'Multiple choice rewards Quiz. A definition you must write rewards Write Answer. A labeled diagram rewards a picture on the front and the name on the back. Match is a warm-up the morning of, not the work.',
              },
            ],
          },
        ],
      },
      {
        id: 'calendar',
        heading: 'The calendar beats another reread',
        blocks: [
          {
            type: 'p',
            text: 'SM-2 is included. Rate honestly. A card you “sort of” knew is Missed or Hard, or it will show up the week after the exam. Build a Study Mix of every deck in the course so the early chapters stay in the queue. Pro is required for the mix and for pictures. The study modes and the schedule are not.',
          },
          {
            type: 'p',
            text: 'Listen on a commute is extra exposure. It does not mark the card reviewed. If the exam is tomorrow, the setting that lets a rated card return the same day is a cram, and you should know you are cramming. If the exam is in a month, leave the scheduled gaps alone.',
          },
          {
            type: 'p',
            text: 'Sample Sets are a start for a standard course, not a substitute for your lecturer’s wording. Copy a deck if it helps, then edit the cards until the back matches the answer your exam will accept. Share a deck with a study group as copies. You will not see their scores, and they will not reset yours.',
          },
          {
            type: 'callout',
            title: 'What flashcards will not do',
            text: 'They will not write the essay, work the long problem, or replace a practice test. Use them for the rules, the names, the exceptions, and the diagrams. Do the long problems elsewhere, then card the step you got wrong.',
          },
        ],
      },
    ],
    faqs: [
      {
        q: 'Do flashcards work for exams?',
        a: 'They work for facts you have to recall: definitions, exceptions, labels, formulas. They do not replace practice problems or essays. Cloze cards and Write Answer are the useful modes. Rereading a highlighted deck is not.',
      },
      {
        q: 'How do I stop forgetting the first chapters?',
        a: 'Leave those decks in a Study Mix with the new material, and let spaced repetition decide when a card is due. Opening only the newest deck is how the early cards fade.',
      },
    ],
    related: ['spaced-repetition', 'study-mixes', 'create-decks-with-ai'],
  },
  {
    slug: 'learn-a-language-on-a-walk',
    category: 'guides',
    accent: '#ff6b57',
    mark: 'Walk',
    plan: 'Guide',
    title: 'Learn a language on a walk',
    seoTitle: 'Learn a Language on a Walk with Audio Flashcards',
    description:
      'How to review a language while walking: Zipdeck Listen speaks the prompt, waits, and then speaks the answer. What it helps, and what still needs a real study session.',
    excerpt:
      'A walk can hold a deck. It cannot be the only time you study, because listening does not update what you know.',
    lede: 'The commute is already gone. Listening is how some of it comes back. Zipdeck can speak a language deck while you walk, run, or do chores. The pause is when you answer. The spoken answer is the check. Then you still sit down and rate the cards, because the walk did not do that.',
    sections: [
      {
        id: 'setup',
        heading: 'Set the walk up so it is practice',
        blocks: [
          {
            type: 'steps',
            items: [
              {
                title: 'Choose a deck you have already seen',
                text: 'First contact with a word should be with your eyes, so you know the spelling and the tone mark. Listen is a later pass. A brand-new deck in your ears becomes noise.',
              },
              {
                title: 'Pause long enough to try',
                text: 'Start around a few seconds and lengthen it if you are cheating by waiting for the answer. You can play the front twice before the pause. Speed belongs near normal until the phrases are easy.',
              },
              {
                title: 'Hear the side you need to produce',
                text: 'If you want to speak, hear your language first and answer in theirs during the pause. If you want to understand, hear theirs first. The switch is which side plays first.',
              },
              {
                title: 'Keep the phone in the pocket',
                text: 'Lock-screen controls are the point. A sleep timer stops it when the walk ends. On Android, allow the player notification or the session dies when the screen locks.',
              },
            ],
          },
          {
            type: 'p',
            text: [
              'The ',
              { t: 'Audio Flashcards page', to: '/audio-flashcards' },
              ' is the product description. ',
              { t: 'Listen', to: '/blog/listen-to-flashcards' },
              ' is the settings. Audio Review is the free cousin: you hear one prompt, reveal, and rate. Use that when you want the walk to count as a review. Use Listen when you refuse to touch the screen.',
            ],
          },
        ],
      },
      {
        id: 'scene',
        heading: 'Words on the walk, a scene at home',
        blocks: [
          {
            type: 'p',
            text: 'A deck of isolated words will not order you a coffee. After a week of Listen on a phrase deck, generate one Language Studio scene at a café or a ticket window and say your lines. Fully learned scenes can hand a few of those lines to the next scene. That is how a walk turns into something you can finish with a person.',
          },
          {
            type: 'p',
            text: 'A set of several lessons can play as one session, and Listen can say the deck name when the lesson changes. That is useful. It is also easy to stop noticing. If you cannot remember which lesson just played, the walk was a podcast. Shorten the session, or go back to a single deck.',
          },
          {
            type: 'callout',
            title: 'The schedule still needs you',
            text: 'Nothing you hear on the walk marks a card Got it. Open the deck later and rate the ones you missed while a car went by. Otherwise the app thinks you know words you have only overheard.',
          },
        ],
      },
    ],
    faqs: [
      {
        q: 'Can you learn a language by listening to flashcards?',
        a: 'You can review words you have already studied. Hear the prompt, answer during the pause, then hear the answer. Listening alone does not update spaced repetition, so you still need a session where you rate or type the card.',
      },
      {
        q: 'What should I listen to on a walk?',
        a: 'A deck you have already seen, with a pause long enough to try an answer. Add a short conversation practice at home for the phrases a word list never makes you say.',
      },
    ],
    related: ['listen-to-flashcards', 'language-studio', 'learn-chinese-with-flashcards'],
  },
]
