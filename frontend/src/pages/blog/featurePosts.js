export const featurePosts = [
  {
    slug: 'zipdeck-features',
    category: 'features',
    accent: '#4c6fff',
    mark: 'All',
    plan: 'Free and Pro',
    title: 'What Zipdeck can do',
    seoTitle: 'Zipdeck Features: Free Study Modes and Pro Tools',
    description:
      'Every Zipdeck feature in one place: five free study modes, SM-2, AI decks, Listen, Language Studio, mixes, pictures, offline study, and classes.',
    excerpt:
      'A map of the product. Free study on one side. Pro tools for creating, listening, and rehearsing on the other.',
    lede: 'Zipdeck is a flashcard app for a word and its translation, a term and its definition, a speech, or a scene. Some of that is free. Some of it is Pro. This is the map, with a link to the longer page for each part.',
    sections: [
      {
        id: 'free',
        heading: 'Free on the website and both apps',
        blocks: [
          {
            type: 'steps',
            items: [
              {
                title: 'Five study modes',
                text: 'Flip, Quiz, Write Answer, Match, and Audio Review. No round limit and no ads. Audio Review is the one where you hear the prompt and then rate the card.',
              },
              {
                title: 'Spaced repetition',
                text: 'SM-2. Missed, Hard, Got it, and Easy change when the card is due. The same schedule follows the account on the website, Android, and iOS.',
              },
              {
                title: 'Decks, sets, and Sample Sets',
                text: 'A deck is one pile of cards. A set is a folder. Sample Sets can be read on the web and copied into your account. Your ratings stay on the copy.',
              },
              {
                title: 'CSV, share links, and classes',
                text: 'Import and export your own cards as CSV. An 8-character share link gives someone their own copy. A class uses a 6-character code and does the same for every student.',
              },
            ],
          },
          {
            type: 'p',
            text: 'Hints are free. So is putting cards in the order you want, and choosing deck order, reverse order, or random when a session starts. You can sign in with email or with Google. The same login is the account on every device.',
          },
        ],
      },
      {
        id: 'pro',
        heading: 'What Pro adds',
        blocks: [
          {
            type: 'ul',
            items: [
              'Create with AI — a prompt or a PDF, Word, or text file, including presets for a speech, a script, and cloze notes. One generation uses one credit.',
              'Edit cards with AI — one instruction across a deck you already have, with a preview before anything is saved.',
              'Language Studio — a spoken scene at a level from A1 to C1. You practice turn by turn, or listen to both sides.',
              'Listen — the front, a pause, then the answer, for a deck, a set, a mix, a scene, or the offline decks on the phone. It does not grade the cards.',
              'Study Mixes — several decks in one due queue, so last month’s material does not disappear.',
              'Pictures on the front or the back. JPG, PNG, or GIF, up to 5 MB.',
              'Rehearse in Order — the deck from first card to last, for a speech or a scene. Due dates stay as they are.',
              'Offline flip — a text copy on the device. No pictures, and that session does not update the schedule.',
            ],
          },
          {
            type: 'p',
            text: 'Pro includes a monthly pool of AI credits. Unused included credits reset next month. Extra credits you buy stay until you use them. Create with AI and Language Studio generation spend a credit. Practice, Listen, and saving an edit do not. The subscription is the same account on the website and both apps.',
          },
          {
            type: 'callout',
            title: 'A limit worth knowing',
            text: 'Listen, offline flip, and Rehearse in Order are practice. They do not move the SM-2 calendar. The reviews that count are the ones where you rate a card, or where Quiz, Write, and Match score the answer.',
          },
        ],
      },
      {
        id: 'read-next',
        heading: 'Read the page for the feature you will actually use',
        blocks: [
          {
            type: 'ul',
            items: [
              [{ t: 'Five study modes', to: '/blog/study-modes' }, ' — when to flip, and when to type.'],
              [{ t: 'Spaced repetition', to: '/blog/spaced-repetition' }, ' — what the four buttons do.'],
              [{ t: 'Create a deck with AI', to: '/blog/create-decks-with-ai' }, ' — speeches, scripts, and cloze.'],
              [{ t: 'Edit cards with AI', to: '/blog/edit-cards-with-ai' }, ' — one change, then a preview.'],
              [{ t: 'Listen', to: '/blog/listen-to-flashcards' }, ' — a walk, a run, a workout.'],
              [{ t: 'Language Studio', to: '/blog/language-studio' }, ' — a scene you can finish.'],
              [{ t: 'Study Mixes', to: '/blog/study-mixes' }, ' — old cards back in the queue.'],
              [{ t: 'Pictures', to: '/blog/pictures-on-flashcards' }, ' — anatomy, maps, objects.'],
              [{ t: 'Offline', to: '/blog/offline-flashcards' }, ' — a text copy on the plane.'],
              [{ t: 'Rehearse in Order', to: '/blog/rehearse-in-order' }, ' — the speech from the top.'],
              [{ t: 'Sample Sets and CSV', to: '/blog/sample-sets-and-csv' }, ' — start from a deck, or a spreadsheet.'],
              [{ t: 'Share a deck or teach a class', to: '/blog/share-a-deck-or-a-class' }, ' — copies, not a shared score.'],
            ],
          },
        ],
      },
    ],
    faqs: [
      {
        q: 'What is free in Zipdeck?',
        a: 'Flip, Quiz, Write Answer, Match, Audio Review, spaced repetition, decks, sets, Sample Sets, CSV import and export, share links, and classes. There are no ads.',
      },
      {
        q: 'What does Zipdeck Pro include?',
        a: 'Create with AI, Edit cards with AI, Language Studio, Listen, Study Mixes, pictures on cards, Rehearse in Order, an offline text copy, and a monthly AI credit allowance. The same Pro login works on the website and both mobile apps.',
      },
    ],
    related: ['best-flashcard-apps-2026', 'study-modes', 'create-decks-with-ai'],
  },
  {
    slug: 'study-modes',
    category: 'features',
    accent: '#4c6fff',
    mark: 'Quiz',
    plan: 'Free',
    title: 'Five ways to study one deck',
    seoTitle: 'Zipdeck Study Modes: Flip, Quiz, Write, Match, Audio',
    description:
      'How to use Zipdeck’s five free study modes. Flip and Audio Review ask you to rate recall. Quiz, Write Answer, and Match score the attempt.',
    excerpt:
      'Recognition is cheap. Typing the answer is where a word usually sticks. Each mode asks for a different kind of memory.',
    lede: 'One deck can be studied five ways, and they are not interchangeable. Flip checks whether you knew it. Quiz checks whether you can spot it. Write makes you produce it. Match is speed. Audio Review is the same recall as Flip, with the prompt in your ears.',
    sections: [
      {
        id: 'five',
        heading: 'What each mode is for',
        blocks: [
          {
            type: 'cards',
            cards: [
              {
                kind: 'Flip',
                front: 'Mitochondria',
                back: 'Where the cell makes ATP',
                hint: 'You rate the recall after you see the back.',
              },
              {
                kind: 'Quiz',
                front: 'Consideration',
                back: 'Bargained-for exchange',
                hint: 'The other three options come from this deck.',
              },
              {
                kind: 'Write',
                front: '谢谢',
                back: 'xièxie',
                hint: 'No choices. Type it.',
              },
            ],
          },
          {
            type: 'steps',
            items: [
              {
                title: 'Flip',
                text: 'Read the front, say the answer, then tap. Rate Missed, Hard, Got it, or Easy. Use this when the card is new and you are still learning what “right” looks like.',
              },
              {
                title: 'Quiz',
                text: 'Four options, built from the deck, so the wrong answers are neighbors rather than noise. A correct tap is a correct tap. You are recognizing, not producing.',
              },
              {
                title: 'Write Answer',
                text: 'Type the back from memory. This is the slow mode, and the one to use when a translation, a definition, or a rule has to come out of you. Be strict with yourself on Flip. Write is strict for you.',
              },
              {
                title: 'Match',
                text: 'Prompts on one side, answers on the other. Pair them. Misses are the pairs to notice. It is a good warm-up, and a poor last step, because you can match a pair you could not say.',
              },
              {
                title: 'Audio Review',
                text: 'The prompt is spoken. Reveal when you have it, then rate, the same way as Flip. This is still a study session. It is not Listen. Listen is the hands-free player, it is Pro, and it does not rate the card.',
              },
            ],
          },
        ],
      },
      {
        id: 'after',
        heading: 'After the session',
        blocks: [
          {
            type: 'p',
            text: 'When the due cards run out, you can continue the rest of the deck, restart what you just studied, or drill only the cards you marked Missed or Hard. Ratings stay. Restarting puts those cards back in the queue. It does not wipe the score you gave them.',
          },
          {
            type: 'p',
            text: 'A new deck has nothing due. That is normal. The first pass is what puts cards on the calendar. If you want the session to follow the speech from top to bottom instead of by due date, that is Rehearse in Order, and it is a different tool.',
          },
          {
            type: 'callout',
            title: 'A useful order for a new deck',
            text: 'Flip until the backs look familiar. Quiz to catch the ones you mix up. Write the ones that still feel soft. Match only as a warm-up the next day. Audio Review when you can look away and still want the rating to count.',
          },
        ],
      },
    ],
    faqs: [
      {
        q: 'Are Zipdeck’s study modes free?',
        a: 'Yes. Flip, Quiz, Write Answer, Match, and Audio Review are free, unlimited, and ad-free. Listen, which plays through a deck without asking you to rate, is Pro.',
      },
      {
        q: 'Which study mode is best for memory?',
        a: 'Write Answer, because you produce the answer instead of recognizing it. Flip is the right start. Quiz and Match are faster and easier, so they are weaker as a final check.',
      },
    ],
    related: ['spaced-repetition', 'listen-to-flashcards', 'rehearse-in-order'],
  },
  {
    slug: 'spaced-repetition',
    category: 'features',
    accent: '#f2b84b',
    mark: 'SM-2',
    plan: 'Free',
    title: 'How Zipdeck spaces your reviews',
    seoTitle: 'Spaced Repetition in Zipdeck: How SM-2 Works',
    description:
      'Zipdeck uses the SM-2 spaced-repetition schedule. How Missed, Hard, Got it, and Easy change the next review, and what does not update the schedule.',
    excerpt:
      'A card should return when you are about to forget it. Missed pulls it back. Got it pushes it out. That is the whole calendar.',
    lede: 'Cramming feels fluent the same night and thin two days later. Zipdeck uses SuperMemo 2, usually called SM-2, to put a gap between reviews. The gap grows when the card is sticking and shrinks when it is not.',
    sections: [
      {
        id: 'buttons',
        heading: 'What the four buttons mean',
        blocks: [
          {
            type: 'steps',
            items: [
              {
                title: 'Missed',
                text: 'Wrong, or you could not recall it. If you would not count it as right in the room, count it as Missed here. The card comes back soon. Expect this on a minority of cards, not on most of them.',
              },
              {
                title: 'Hard',
                text: 'Right, but you hesitated or nearly lost it. The wait stays short. Hard is useful. It is not a failure.',
              },
              {
                title: 'Got it',
                text: 'Right, with some effort. This should be the button you press most. The gap grows: about a day, then longer.',
              },
              {
                title: 'Easy',
                text: 'Right, and it took nothing. The gap grows faster. Save Easy for cards you could say while distracted. Using it to feel finished teaches the scheduler the wrong lesson.',
              },
            ],
          },
          {
            type: 'p',
            text: 'SM-2 keeps two ideas about each card: when it is due, and how easy it has been. A miss resets the wait. A run of Got it stretches it. You do not pick the date. You pick the rating, and the date follows.',
          },
        ],
      },
      {
        id: 'settings',
        heading: 'What you can change, and what you should leave',
        blocks: [
          {
            type: 'p',
            text: 'Settings can start a session in deck order, reverse order, or at random. Deck order matters for a speech. Random matters for vocabulary, because position in the list is a hint you will not have later.',
          },
          {
            type: 'p',
            text: 'There is also a choice for after a review: wait until the scheduled day, or allow the card to return again today. The scheduled day is the point of SM-2. Immediate return is for a cram before a test you have tomorrow, and you should know that you are borrowing against the calendar.',
          },
          {
            type: 'p',
            text: 'Quiz, Write, and Match score the attempt themselves. Flip and Audio Review use the button you tap. Listen, offline flip, and Rehearse in Order do not write a rating. A card you only heard on a run is not a card you reviewed.',
          },
        ],
      },
      {
        id: 'caught-up',
        heading: 'Nothing due is a result, not an empty app',
        blocks: [
          {
            type: 'p',
            text: 'When the deck says you are caught up, the cards you know are waiting on purpose. You can still restart the deck, study only Hard or Missed cards, or build a Study Mix so an older deck shares the session. Studying a card that is not due, every day, is how people get bored of material they already own.',
          },
          {
            type: 'callout',
            title: 'Be a slightly harsh grader',
            text: 'If you only sort of knew it, it was Missed or Hard. The schedule is only as honest as the button. A deck full of Easy, pressed too early, comes back in a month and feels brand new.',
          },
        ],
      },
    ],
    faqs: [
      {
        q: 'Does Zipdeck use spaced repetition?',
        a: 'Yes. Zipdeck uses SM-2. It is included on the free account, on the website and both mobile apps.',
      },
      {
        q: 'Does listening update my review schedule?',
        a: 'No. Listen, offline flip, and Rehearse in Order leave due dates alone. Flip, Audio Review, Quiz, Write Answer, and Match are the sessions that count.',
      },
    ],
    related: ['study-modes', 'study-mixes', 'zipdeck-vs-anki'],
  },
  {
    slug: 'create-decks-with-ai',
    category: 'features',
    accent: '#3fcf8e',
    mark: 'AI',
    plan: 'Pro',
    title: 'Create a deck with AI',
    seoTitle: 'Create Flashcards with AI: Speeches, Scripts, and Notes',
    description:
      'Zipdeck Create with AI drafts a deck from a prompt or a file. Presets for a speech, a script, and cloze notes, and what you should edit before you study.',
    excerpt:
      'The slow part of flashcards is typing them. A preset tells the draft what the front of the card is supposed to be.',
    lede: 'Create with AI is a Pro tool that drafts one deck from a prompt or from a file. You still edit it. The useful part is the preset: a speech, a script, and a page of notes should not become the same kind of card.',
    sections: [
      {
        id: 'presets',
        heading: 'Three presets, three shapes of card',
        blocks: [
          {
            type: 'steps',
            items: [
              {
                title: 'Memorize a speech',
                text: 'Keep the speech in order. The front is the previous sentence, or “Start of speech” on the first card. The back is the sentence you have to say next. The hint is the first letter of each word. It does not summarize and it does not rewrite.',
              },
              {
                title: 'Learn a script',
                text: 'The front is the other character’s cue. The back is your line. The hint is first letters again. Name the character if you only want one role. If you do not, the draft picks the role with the most lines and says so.',
              },
              {
                title: 'Cloze from notes',
                text: 'The front is one sentence with the key term replaced by a blank. The back is the missing word or short phrase, not the whole sentence. Several important terms in one sentence become several cards.',
              },
            ],
          },
          {
            type: 'p',
            text: 'You can also skip the presets and describe a deck in the box: “Spanish travel phrases for a week in Madrid, 25 cards.” Set the front and back languages when you know them. For the speech, script, and cloze presets, leave both languages on Auto.',
          },
        ],
      },
      {
        id: 'files',
        heading: 'What you can attach',
        blocks: [
          {
            type: 'p',
            text: 'PDF, Word (.docx), or text, up to 8 MB. The file needs real text. A scan that is only a picture of a page will not work. You can paste the speech or the scene into the prompt instead of attaching it. One run creates one deck and uses one AI credit. If the draft fails or comes back with no cards, you are not charged.',
          },
          {
            type: 'p',
            text: 'The prompt and the file are sent to the model that generates the deck. Do not upload something you would not want processed that way. A wedding speech is fine. A client’s confidential notes are a different decision.',
          },
          {
            type: 'callout',
            title: 'Edit before you trust it',
            text: 'Read the first five cards against the source. A speech preset that paraphrases has failed, even if the sentences sound polished. Fix those cards, or run Edit cards with AI with a specific instruction. Then study.',
          },
        ],
      },
    ],
    faqs: [
      {
        q: 'Is Create with AI free?',
        a: 'No. It is part of Zipdeck Pro, and each deck you generate uses one AI credit. Studying the deck afterward is free.',
      },
      {
        q: 'Will AI memorize my speech for me?',
        a: 'It builds the cards and keeps them in order. You still rehearse them out loud. The preset is told not to rewrite the speech, and you should check that it did not.',
      },
    ],
    related: ['edit-cards-with-ai', 'memorize-a-best-man-speech', 'learn-lines-for-a-play'],
  },
  {
    slug: 'edit-cards-with-ai',
    category: 'features',
    accent: '#3fcf8e',
    mark: 'Edit',
    plan: 'Pro',
    title: 'Edit a whole deck with one instruction',
    seoTitle: 'Edit Flashcards with AI, Then Preview the Change',
    description:
      'Edit cards with AI applies one instruction across a Zipdeck deck. You compare a preview before anything is saved, and a failed edit does not spend a credit.',
    excerpt:
      'Swap the sides, add a hint, or tighten the wording. You see Now and After before a single card changes.',
    lede: 'Create with AI makes a new deck. Edit cards with AI changes the cards you already have. One instruction applies across the deck. Nothing is saved until you accept a preview.',
    sections: [
      {
        id: 'how',
        heading: 'How a pass works',
        blocks: [
          {
            type: 'steps',
            items: [
              {
                title: 'Open the deck',
                text: 'You need at least two cards. Very large decks are refused in one pass, so split them if the app says the deck is too big.',
              },
              {
                title: 'Say what should change',
                text: 'Specific is cheaper than vague, because a vague instruction still uses the credit if it produces a preview. “Swap the front and the back.” “Add a first-letter hint.” “Make the back pinyin only, and move the English to the hint.”',
              },
              {
                title: 'Compare Now and After',
                text: 'Save changes updates the cards you keep. Discard leaves the deck as it was. Showing the preview uses one credit. Saving does not use another. If the preview fails, or nothing would change, you are not charged.',
              },
            ],
          },
        ],
      },
      {
        id: 'use',
        heading: 'Instructions that are worth a credit',
        blocks: [
          {
            type: 'ul',
            items: [
              'A vocabulary deck typed in the wrong direction, so you want to produce the foreign word instead of recognize it.',
              'A speech deck with no hints. Ask for the first letter of each word on the back, with the words themselves left alone.',
              'Definitions that include the term you were supposed to recall. Ask for that word to be removed from the front only.',
            ],
          },
          {
            type: 'p',
            text: 'Do not ask it to “make this better.” You will spend the credit on a paraphrase you then have to undo. The preview is the point. Read it. A wrong edit that you save is just an edit. You can run another pass, and that is another credit.',
          },
        ],
      },
    ],
    faqs: [
      {
        q: 'Does Edit cards with AI change my deck immediately?',
        a: 'No. You get a preview of Now and After. Save applies the cards you keep. Discard leaves the deck alone. The preview is what uses the credit.',
      },
      {
        q: 'What if the edit does nothing?',
        a: 'If the preview fails, or the cards would not change, the credit is not used.',
      },
    ],
    related: ['create-decks-with-ai', 'study-modes', 'sample-sets-and-csv'],
  },
  {
    slug: 'listen-to-flashcards',
    category: 'features',
    accent: '#ff6b57',
    mark: 'Hear',
    plan: 'Pro',
    title: 'Listen to a deck while you walk',
    seoTitle: 'Listen to Flashcards on a Walk, Run, or Workout',
    description:
      'Zipdeck Listen speaks the front of a card, waits, then speaks the answer. How the pause, sleep timer, and lock screen work, and why it does not change your schedule.',
    excerpt:
      'The pause is the practice. Hear the question, answer in your head, then hear whether you were right.',
    lede: 'Listen is the Pro player for when your hands are busy. It speaks the front, waits, then speaks the answer. A deck, a whole set, a study mix, a Language Studio scene, or the offline decks on the phone can be one session.',
    sections: [
      {
        id: 'pause',
        heading: 'The pause is the whole feature',
        blocks: [
          {
            type: 'p',
            text: [
              'If the answer arrives immediately, you are hearing a podcast of your own notes. Set the pause long enough that you can recall. Short, medium, and long are starting points. You can also set the wait in seconds, from 0 to 60. The public page ',
              { t: 'Audio Flashcards', to: '/audio-flashcards' },
              ' shows the walks, runs, workouts, and chores this is built for.',
            ],
          },
          {
            type: 'p',
            text: 'You can hear the front or the answer first, play either side twice, change the speed, and loop when the cards finish. When a set or a mix changes deck, Listen can say the deck name so you know the lesson changed. Turn that off if it breaks your concentration.',
          },
          {
            type: 'callout',
            title: 'It does not grade you',
            text: 'Listening does not mark a card Missed or Got it. Your due dates stay exactly where they were. Use Listen to keep a language in your ear. Use Flip, Write, or Audio Review when you need the schedule to move.',
          },
        ],
      },
      {
        id: 'phone',
        heading: 'The phone can stay in a pocket',
        blocks: [
          {
            type: 'p',
            text: 'On iPhone and iPad, playback continues when the device is locked. The lock screen has play, pause, and skip. Force-quitting the app stops it. No extra permission is required.',
          },
          {
            type: 'p',
            text: 'On Android, the first time you press Play the phone may ask to allow notifications. That notification is the player on the lock screen. Zipdeck does not send other alerts from Listen. If the phone has a battery setting named Allow background usage for Zipdeck, leave it on or the session will die in your pocket.',
          },
          {
            type: 'p',
            text: 'A sleep timer stops the session when the time is up, including on the lock screen. Five more minutes is a button, not a new session. Headphones can pause and skip. The voice is the text-to-speech voice installed on the device, so a language with no voice installed will not magically acquire one. You can choose, in Settings, whether a missing voice stays silent or falls back to another language.',
          },
        ],
      },
    ],
    faqs: [
      {
        q: 'Is Listen the same as Audio Review?',
        a: 'No. Audio Review is a free study mode: you hear the prompt, reveal, and rate the card, and the rating updates SM-2. Listen is Pro, plays by itself, and does not change your schedule.',
      },
      {
        q: 'Can I listen to more than one deck?',
        a: 'Yes. A set, a study mix, or the offline decks saved on the phone can play as one session. Listen can say the deck name when it changes.',
      },
    ],
    related: ['learn-a-language-on-a-walk', 'study-modes', 'offline-flashcards'],
  },
  {
    slug: 'language-studio',
    category: 'features',
    accent: '#4c6fff',
    mark: 'Say',
    plan: 'Pro',
    title: 'Practice a conversation, not only a word list',
    seoTitle: 'Language Studio: AI Conversations You Can Say',
    description:
      'Zipdeck Language Studio writes a spoken scene at your level, from A1 to C1. Practice your line before you reveal it, or listen to both sides.',
    excerpt:
      'A word list gets you the noun. A scene at a pharmacy gets you the sentence you freeze on.',
    lede: 'Language Studio is where Zipdeck stops being only flashcards. You describe a situation. It writes a short conversation at the level you pick. You say your line before you see it. The longer public page is AI language conversations. This one is how to use it.',
    sections: [
      {
        id: 'scene',
        heading: 'Build a scene you might actually be in',
        blocks: [
          {
            type: 'cards',
            cards: [
              {
                kind: 'They speak',
                front: 'Hola, ¿en qué puedo ayudarle?',
                back: 'Hello, how can I help you?',
                hint: 'The other person starts. You answer.',
              },
              {
                kind: 'You speak',
                front: 'I need something for a headache.',
                back: 'Necesito algo para el dolor de cabeza.',
                hint: 'Meaning first. Then the line in the language you are learning.',
              },
            ],
          },
          {
            type: 'p',
            text: [
              'Pick the language you speak and the language you are learning. They have to be different. Choose a level from A1 (very short sentences) to C1 (precise and fluent for the setting). Then pick a place — café, airport, doctor, hotel, pharmacy, interview — or describe a custom scene. Optional details steer the plot: oat milk, a missed bag, a note for work. The ',
              { t: 'language conversations page', to: '/language-conversations' },
              ' covers why speaking practice is a different memory from a word list.',
            ],
          },
          {
            type: 'p',
            text: 'Generating a scene uses one credit. Sample scenes to and from English do not. Copy a sample into your library, practice it, and grade it before you spend a credit on a scene of your own.',
          },
        ],
      },
      {
        id: 'practice',
        heading: 'Say it, then reveal it',
        blocks: [
          {
            type: 'p',
            text: 'Practice shows the meaning in your language and asks you to say the line in theirs. Reveal after you try. At the end you grade the whole conversation, not each line: Hard, Getting there, Almost learned, or Fully learned.',
          },
          {
            type: 'p',
            text: 'Fully learned is the grade that matters later. Those scenes can lend a few of their lines to the next conversation you generate, so a pharmacy word shows up again in a different place. The other grades only record how this practice went. Scenes you have not marked Fully learned are not treated as known.',
          },
          {
            type: 'p',
            text: 'Listen plays both sides with the same pause and sleep timer you use for decks. When it finishes, you grade the scene the same way. Practice and Listen do not change your flashcard schedule. If you want a word from the scene on SM-2, put that word on a card in My Decks.',
          },
        ],
      },
    ],
    faqs: [
      {
        q: 'What is Zipdeck Language Studio?',
        a: 'A Pro feature that writes a short spoken conversation at a fluency level you choose. You practice turn by turn, or listen to both sides, and you grade the whole scene.',
      },
      {
        q: 'Does Language Studio replace flashcards?',
        a: 'No. Flashcards are how a word sticks. A scene is how you find that word while someone is waiting. Use both. Sample decks and Sample scenes are the free-to-try versions of each.',
      },
    ],
    related: ['learn-chinese-with-flashcards', 'learn-a-language-on-a-walk', 'listen-to-flashcards'],
  },
  {
    slug: 'study-mixes',
    category: 'features',
    accent: '#f2b84b',
    mark: 'Mix',
    plan: 'Pro',
    title: 'Mix old decks back into today’s session',
    seoTitle: 'Study Mixes: Review Old and New Flashcards Together',
    description:
      'A Zipdeck Study Mix pulls several decks or sets into one session so older cards stay in rotation with what you just learned.',
    excerpt:
      'New cards crowd out old ones. A mix puts chapter 1 back in the queue with chapter 4.',
    lede: 'The deck you made this week gets all the attention. The deck from last month sits there, finished, and quietly expires. A Study Mix is a Pro session that pulls several decks, or a whole set, into one queue.',
    sections: [
      {
        id: 'why',
        heading: 'Why a second deck is not a review',
        blocks: [
          {
            type: 'p',
            text: 'SM-2 already waits longer on cards you know. That only helps if you open a session that includes them. If you only ever open the new deck, the old cards become due in an app you are not looking at. A mix is how you look at them without abandoning the new material.',
          },
          {
            type: 'steps',
            items: [
              {
                title: 'Create a mix and name it for the course',
                text: '“Spanish, all of it” is a better name than “Mix 3.” You will forget what you ticked.',
              },
              {
                title: 'Tick the decks, or a whole set',
                text: 'A set is the folder. Ticking the set is how a class stays in one session as you add decks later. Check that the new deck is actually in the set.',
              },
              {
                title: 'Study it like a deck',
                text: 'Due cards from every source show up together. Ratings write back to the card, so the schedule stays per card, not per mix.',
              },
            ],
          },
        ],
      },
      {
        id: 'limits',
        heading: 'What a mix does not do',
        blocks: [
          {
            type: 'p',
            text: 'It does not rewrite cards, and it does not merge them into one deck. Delete the mix and the decks are still there. It also does not put the cards in chapter order. If you need order, rehearse the speech deck on its own. If you need ears only, Listen can play a mix without grading it, which is a different session from studying the mix.',
          },
          {
            type: 'callout',
            title: 'A mix for exam week',
            text: 'One mix of every deck in the course, studied on Write for the rules you must say and Quiz for the ones you only need to recognize. Leave the brand-new deck in the mix. Pulling it out is how it becomes the thing you cram the night before.',
          },
        ],
      },
    ],
    faqs: [
      {
        q: 'What is a Study Mix?',
        a: 'A Pro session that combines decks and sets so due cards from all of them appear together. Ratings still belong to each card.',
      },
      {
        q: 'Do I need a mix for spaced repetition to work?',
        a: 'No. Each deck already has its own schedule. A mix matters when you would otherwise stop opening the older decks.',
      },
    ],
    related: ['spaced-repetition', 'flashcards-for-exams', 'listen-to-flashcards'],
  },
  {
    slug: 'pictures-on-flashcards',
    category: 'features',
    accent: '#3fcf8e',
    mark: 'Img',
    plan: 'Pro',
    title: 'Put a picture on the card',
    seoTitle: 'Picture Flashcards for Vocabulary, Anatomy, and Maps',
    description:
      'Zipdeck Pro can put a photo on the front or back of a card. When an image helps, and when it gives away the answer.',
    excerpt:
      'A cranial nerve, a street sign, a piece of fruit. The picture is the prompt. The name is what you produce.',
    lede: 'Some things are not a sentence. A bone, a map, a counterfeit you are learning to spot, the face of a character in a scene. Pro can put a photo on the front or the back of a card. JPG, PNG, or GIF, up to 5 MB.',
    sections: [
      {
        id: 'which-side',
        heading: 'Put the picture on the side you will be shown',
        blocks: [
          {
            type: 'p',
            text: 'If the real world shows you the thing and asks for the name, the picture belongs on the front and the name on the back. Anatomy works this way. So does “what is this called?” in a new language. If the real world gives you the word and you need the image, reverse it. A picture on both sides usually gives the answer away.',
          },
          {
            type: 'ul',
            items: [
              'Vocabulary you can point at: foods, tools, signs, clothes.',
              'Anatomy, histology, and anything your exam shows as a photo.',
              'Maps and floor plans, with the label on the back.',
              'A face or a costume for a scene, when the line is cued by who you are looking at.',
            ],
          },
          {
            type: 'p',
            text: 'Offline copies do not include pictures. The text still flips on the plane. The image waits until you are online. Listen speaks text. It will not describe the photo. If the card is only a picture, give it a short front or back in words too, or the audio session has nothing to say.',
          },
        ],
      },
      {
        id: 'dont',
        heading: 'When a picture makes the card worse',
        blocks: [
          {
            type: 'p',
            text: 'A decorative image next to a definition adds recognition of the decoration, not of the idea. A labeled diagram on the front is a card you can “know” by reading the label. Crop the label off, or put the labeled version on the back as the answer.',
          },
          {
            type: 'callout',
            title: 'One fact per card still applies',
            text: 'A photo of a whole skeleton with twelve arrows is a poster. Crop to the structure you have to name, and make the next structure the next card.',
          },
        ],
      },
    ],
    faqs: [
      {
        q: 'Can I add images to Zipdeck cards?',
        a: 'Yes, with Pro. A picture can sit on the front or the back. JPG, PNG, or GIF, up to 5 MB.',
      },
      {
        q: 'Do pictures work offline?',
        a: 'No. The offline copy is text only. Pictures load when you are online.',
      },
    ],
    related: ['offline-flashcards', 'flashcards-for-exams', 'learn-chinese-with-flashcards'],
  },
  {
    slug: 'offline-flashcards',
    category: 'features',
    accent: '#7c6cff',
    mark: 'Off',
    plan: 'Pro',
    title: 'Flip a deck on the plane',
    seoTitle: 'Offline Flashcards: Study a Deck with No Connection',
    description:
      'Download a text copy of a Zipdeck deck and flip it offline, without signing in. Pictures stay online, and offline study does not change your schedule.',
    excerpt:
      'Save the deck before you lose signal. The copy flips without a login. It does not pretend to be a full review.',
    lede: 'Offline study is a Pro download. Open a deck while you are online, tap the download icon next to Share, and the text of that deck is saved on the device. You can flip it later with no connection, and without signing in.',
    sections: [
      {
        id: 'what-saves',
        heading: 'What is on the device, and what is not',
        blocks: [
          {
            type: 'ul',
            items: [
              'The words are saved. Front, back, and hint.',
              'Pictures are not saved. They stay online.',
              'The copy remains after you sign out, until you remove it.',
              'Removing the copy does not delete the deck in your account.',
              'A deck with no text, only images, has nothing to save.',
            ],
          },
          {
            type: 'p',
            text: 'Offline flip does not update your review schedule. Treat it as reading with your eyes closed between cards, not as the session SM-2 is counting. When you are back online, study the deck properly if those cards were due.',
          },
        ],
      },
      {
        id: 'listen-offline',
        heading: 'You can also hear the offline decks',
        blocks: [
          {
            type: 'p',
            text: 'Offline Decks can be played with no sign-in. That session starts with a 4-second pause after the question, separate from the Listen defaults in Settings. You can change the pause there. It is the same idea as Listen: the cards are unchanged when it ends.',
          },
          {
            type: 'callout',
            title: 'Download before the tunnel',
            text: 'The icon is easy to forget until the train has already left the station. If a trip is why you wanted Pro, download the decks the night before and open Offline Decks once while you still have signal, so you know the copy is there.',
          },
        ],
      },
    ],
    faqs: [
      {
        q: 'Can I study Zipdeck offline?',
        a: 'Yes, with Pro. Download a deck while you are online, then flip the text copy with no connection. Pictures are not included, and offline study does not change due dates.',
      },
      {
        q: 'Do I have to stay signed in?',
        a: 'No. The copy stays on the device after you sign out. Your account deck is separate and is still there when you sign back in.',
      },
    ],
    related: ['listen-to-flashcards', 'pictures-on-flashcards', 'spaced-repetition'],
  },
  {
    slug: 'rehearse-in-order',
    category: 'features',
    accent: '#ff6b57',
    mark: '1–2',
    plan: 'Pro',
    title: 'Rehearse a deck from the first card to the last',
    seoTitle: 'Rehearse Flashcards in Order for a Speech or Script',
    description:
      'Zipdeck Rehearse in Order walks a deck from start to finish for speeches, scripts, and talks. Ratings are skipped, so your spaced-repetition schedule stays put.',
    excerpt:
      'Spaced repetition is the wrong order for a toast. Rehearse walks the cards in the order you will say them.',
    lede: 'SM-2 is happy to show you card 14 before card 2. That is correct for vocabulary and disastrous for a speech. Rehearse in Order is the Pro mode that walks the deck from the first card to the last and does not touch your due dates.',
    sections: [
      {
        id: 'when',
        heading: 'Use it when order is the memory',
        blocks: [
          {
            type: 'p',
            text: 'A toast, a talk, a scene, a procedure, a piece of music you are naming bar by bar. The card before this one is the cue. If the app shuffles, it has removed the cue. Rehearse keeps deck order. Ratings are skipped, so a run-through the morning of the wedding does not reschedule the vocabulary deck you also study in that account. It does not reschedule this deck either. The run-through is practice, not a review.',
          },
          {
            type: 'steps',
            items: [
              {
                title: 'Put the cards in speaking order first',
                text: 'Drag the handle, or use the arrows, until the deck matches the speech. Rehearse will not invent a better order than the one you saved.',
              },
              {
                title: 'Walk it out loud',
                text: 'Read the front, look up, say the back. Next. The screen is a prompt, not a teleprompter you read while talking.',
              },
              {
                title: 'Then do a real review of the cards you dropped',
                text: 'If a line failed, rate it later in Flip or Write so SM-2 brings that line back. Rehearse will not do that for you.',
              },
            ],
          },
        ],
      },
      {
        id: 'not',
        heading: 'Do not rehearse a vocabulary deck',
        blocks: [
          {
            type: 'p',
            text: 'Order becomes a cheat. You remember that “thank you” follows “hello” because it did in the list, and then you cannot find “thank you” on its own. Random or due-order study is the right tool for words. Rehearse is the right tool for a text that has a sequence in real life.',
          },
        ],
      },
    ],
    faqs: [
      {
        q: 'Does Rehearse in Order change my due dates?',
        a: 'No. Ratings are skipped. The spaced-repetition schedule stays as it was.',
      },
      {
        q: 'When should I use Rehearse instead of Flip?',
        a: 'When the cards are a speech, a script, or anything you must say in order. Use Flip or Write afterward on the lines you missed, so those lines get a real review.',
      },
    ],
    related: ['memorize-a-best-man-speech', 'learn-lines-for-a-play', 'create-decks-with-ai'],
  },
  {
    slug: 'sample-sets-and-csv',
    category: 'features',
    accent: '#4c6fff',
    mark: 'CSV',
    plan: 'Free',
    title: 'Start from a sample deck, or from a spreadsheet',
    seoTitle: 'Sample Flashcard Decks and CSV Import in Zipdeck',
    description:
      'Read Zipdeck Sample Sets for free, copy a deck into your account, or import a CSV with front, back, and an optional hint.',
    excerpt:
      'You do not have to start from a blank deck. Copy a sample, or bring a spreadsheet you already made.',
    lede: 'Two free ways to get cards into an account without typing every row by hand: copy a Sample Set, or import a CSV. Export uses the same columns, so a deck can leave and come back.',
    sections: [
      {
        id: 'samples',
        heading: 'Sample Sets',
        blocks: [
          {
            type: 'p',
            text: [
              'The ',
              { t: 'library', to: '/library' },
              ' is public. You can read every card in a sample deck without an account. Studying makes a copy in My Decks. The catalog copy stays as it was. Your ratings and due dates live on your copy, which you can edit.',
            ],
          },
          {
            type: 'p',
            text: 'Start there for a language. A greeting deck you did not write is still a greeting deck you can say tonight. Add your own cards after the copy exists. Deleting a card in your copy does not change the sample for anyone else.',
          },
        ],
      },
      {
        id: 'csv',
        heading: 'CSV, in both directions',
        blocks: [
          {
            type: 'p',
            text: 'Import and export are on the deck. The file is comma-separated UTF-8. Column 1 is the front, column 2 is the back, column 3 is an optional hint. A header row is optional. If you include one, name the first two columns front and back, or question and answer.',
          },
          {
            type: 'ul',
            items: [
              'A cell with a comma or a quotation mark needs double quotes around it.',
              'A quote inside a cell is two quotes together.',
              'Every card needs a front and a back. Blank rows are skipped.',
              'Tabs, semicolons, and Excel workbooks are not accepted. From Excel or Google Sheets, download CSV UTF-8.',
            ],
          },
          {
            type: 'p',
            text: 'Export downloads that same layout. Edit it in a spreadsheet and import it back when that is faster than the card editor. Pictures are not in the CSV. A Quizlet set you created can be copied out as text and saved in this shape. There is no one-click import from other apps.',
          },
        ],
      },
    ],
    faqs: [
      {
        q: 'Are Zipdeck’s sample decks free?',
        a: 'Yes. You can read them without an account. Create a free account to copy a deck and study it with spaced repetition.',
      },
      {
        q: 'How do I import flashcards into Zipdeck?',
        a: 'Open a deck, choose Import CSV, and use a UTF-8 file with the front in column 1 and the back in column 2. A third column is an optional hint.',
      },
    ],
    related: ['learn-chinese-with-flashcards', 'zipdeck-vs-quizlet', 'share-a-deck-or-a-class'],
  },
  {
    slug: 'share-a-deck-or-a-class',
    category: 'features',
    accent: '#ff6b57',
    mark: 'A1B',
    plan: 'Free',
    title: 'Share a deck, or hand it to a class',
    seoTitle: 'Share Flashcards and Teach a Class in Zipdeck',
    description:
      'Zipdeck share links and classes give each person their own copy of a deck. Ratings stay private. Teacher mode uses a 6-character code.',
    excerpt:
      'The other person never studies your deck. They study a copy, and their ratings are theirs.',
    lede: 'Sharing in Zipdeck does not mean a shared score. A link or a class hands someone their own copy. They can study it, rate it, and edit it without moving your due dates, and you cannot see their ratings.',
    sections: [
      {
        id: 'share',
        heading: 'One person, one link',
        blocks: [
          {
            type: 'p',
            text: 'Share on a deck or a set creates an 8-character link, the same idea as a class code. The other person opens it, copies the deck into their account, and studies that copy. Revoke the link when you want it to stop working. Sharing again makes a new link. The old one stays dead.',
          },
          {
            type: 'p',
            text: 'Use this for a study partner, a scene partner, or a sibling who wants the same vocabulary. Do not use it if you need to know how they scored. You will not.',
          },
        ],
      },
      {
        id: 'class',
        heading: 'A class is the same idea, for everyone',
        blocks: [
          {
            type: 'steps',
            items: [
              {
                title: 'Turn on Teacher mode',
                text: 'The switch is on Classes. You can still join someone else’s class as a student. A free account is enough. The teacher page has the longer version.',
              },
              {
                title: 'Name the class and share the 6-character code',
                text: 'Students join with the code or the link. There is no catalog of classes to search.',
              },
              {
                title: 'Assign a deck',
                text: 'Each student gets a copy in My Decks. Their Missed and Got it stay on that copy. If you fix a typo later, their copy does not change by itself. Share an updated copy, or tell them what to edit.',
              },
            ],
          },
          {
            type: 'p',
            text: [
              'That last point surprises people who are used to a live set. Zipdeck chose private ratings over a deck everyone is editing at once. The ',
              { t: 'teacher page', to: '/teachers' },
              ' is the short public explanation. This is not a quiz bowl and not a live game. It is a way to put the same cards in front of a group.',
            ],
          },
        ],
      },
    ],
    faqs: [
      {
        q: 'Can other people see my flashcard ratings?',
        a: 'No. A share link and a class assignment both create a copy. Ratings and due dates stay on that copy.',
      },
      {
        q: 'Is Zipdeck Teacher mode free?',
        a: 'Yes. Create a class, share a 6-character code, and assign decks on a free account. Students join with a free account too.',
      },
    ],
    related: ['flashcards-for-exams', 'sample-sets-and-csv', 'zipdeck-features'],
  },
]
