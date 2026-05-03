/**
 * Q Game - Question Database
 *
 * HOW TO ADD YOUR EXCEL QUESTIONS:
 * 1. Export your Excel sheet to CSV
 * 2. Each question needs: { id, category, text, tags? }
 * 3. Replace or append to the QUESTIONS array below
 * 4. Categories are auto-generated from question data — no config needed
 *
 * Future: This file can be replaced by a Firestore fetch with zero
 * changes to the rest of the app (see src/services/questionService.js)
 */

export const CATEGORIES = {
  WOULD_YOU_RATHER: "Would You Rather",
  WHICH_IS_WORSE: "Which Is Worse",
  HOW_MUCH: "How Much Would It Take",
  RATE_BELIEVE: "Rate How Much You Believe",
  RATE_LIKE: "Rate How Much You Like",
  HAVE_YOU_EVER: "Have You Ever",
  TELL_A_TIME: "Tell About a Time",
};

/** @type {Question[]} */
export const QUESTIONS = [
  // ── Would You Rather ──────────────────────────────────────────────────────
  {
    id: "wyr-001",
    category: CATEGORIES.WOULD_YOU_RATHER,
    text: "Would you rather be able to speak every language fluently or play every instrument perfectly?",
  },
  {
    id: "wyr-002",
    category: CATEGORIES.WOULD_YOU_RATHER,
    text: "Would you rather always know when someone is lying to you, or always get away with lying yourself?",
  },
  {
    id: "wyr-003",
    category: CATEGORIES.WOULD_YOU_RATHER,
    text: "Would you rather have a rewind button for your life or a pause button?",
  },
  {
    id: "wyr-004",
    category: CATEGORIES.WOULD_YOU_RATHER,
    text: "Would you rather lose all your memories from the past 5 years or never be able to make new long-term memories?",
  },
  {
    id: "wyr-005",
    category: CATEGORIES.WOULD_YOU_RATHER,
    text: "Would you rather be famous for something embarrassing or completely unknown despite doing something incredible?",
  },
  {
    id: "wyr-006",
    category: CATEGORIES.WOULD_YOU_RATHER,
    text: "Would you rather always have to say what you're thinking or never be able to speak again?",
  },
  {
    id: "wyr-007",
    category: CATEGORIES.WOULD_YOU_RATHER,
    text: "Would you rather live in a world without music or a world without movies?",
  },
  {
    id: "wyr-008",
    category: CATEGORIES.WOULD_YOU_RATHER,
    text: "Would you rather be the funniest person in the room or the most intelligent?",
  },
  {
    id: "wyr-009",
    category: CATEGORIES.WOULD_YOU_RATHER,
    text: "Would you rather have the ability to fly or be completely invisible whenever you wanted?",
  },
  {
    id: "wyr-010",
    category: CATEGORIES.WOULD_YOU_RATHER,
    text: "Would you rather know the exact date of your death or the exact cause?",
  },

  // ── Which Is Worse ─────────────────────────────────────────────────────────
  {
    id: "wiw-001",
    category: CATEGORIES.WHICH_IS_WORSE,
    text: "Which is worse: realizing you've been mispronouncing a word for years, or mispronouncing someone's name in front of a crowd?",
  },
  {
    id: "wiw-002",
    category: CATEGORIES.WHICH_IS_WORSE,
    text: "Which is worse: being talked about behind your back or being ignored entirely?",
  },
  {
    id: "wiw-003",
    category: CATEGORIES.WHICH_IS_WORSE,
    text: "Which is worse: a slow and unreliable internet connection for the rest of your life, or never being allowed to use headphones again?",
  },
  {
    id: "wiw-004",
    category: CATEGORIES.WHICH_IS_WORSE,
    text: "Which is worse: accidentally sending a text to the person you were talking about, or pocket-dialing your boss during a private conversation?",
  },
  {
    id: "wiw-005",
    category: CATEGORIES.WHICH_IS_WORSE,
    text: "Which is worse: always arriving 30 minutes late to everything, or always arriving 2 hours early?",
  },
  {
    id: "wiw-006",
    category: CATEGORIES.WHICH_IS_WORSE,
    text: "Which is worse: forgetting someone's name 10 seconds after they tell you, or never remembering birthdays?",
  },

  // ── How Much Would It Take ─────────────────────────────────────────────────
  {
    id: "hm-001",
    category: CATEGORIES.HOW_MUCH,
    text: "How much would someone have to pay you to give up your phone for an entire year?",
  },
  {
    id: "hm-002",
    category: CATEGORIES.HOW_MUCH,
    text: "How much would someone have to pay you to eat nothing but fast food for 30 days straight?",
  },
  {
    id: "hm-003",
    category: CATEGORIES.HOW_MUCH,
    text: "How much would someone have to pay you to shave your head completely bald tomorrow?",
  },
  {
    id: "hm-004",
    category: CATEGORIES.HOW_MUCH,
    text: "How much would someone have to pay you to quit social media forever?",
  },
  {
    id: "hm-005",
    category: CATEGORIES.HOW_MUCH,
    text: "How much would someone have to pay you to move to a country where you don't speak the language for 2 years?",
  },
  {
    id: "hm-006",
    category: CATEGORIES.HOW_MUCH,
    text: "How much would it take for you to never listen to your favorite music artist again?",
  },

  // ── Rate How Much You Believe ──────────────────────────────────────────────
  {
    id: "rb-001",
    category: CATEGORIES.RATE_BELIEVE,
    text: "Rate how much you believe: everything happens for a reason. (1 = not at all, 10 = completely)",
  },
  {
    id: "rb-002",
    category: CATEGORIES.RATE_BELIEVE,
    text: "Rate how much you believe: people can truly change who they are at their core. (1–10)",
  },
  {
    id: "rb-003",
    category: CATEGORIES.RATE_BELIEVE,
    text: "Rate how much you believe: there is intelligent life elsewhere in the universe. (1–10)",
  },
  {
    id: "rb-004",
    category: CATEGORIES.RATE_BELIEVE,
    text: "Rate how much you believe: first impressions are usually accurate. (1–10)",
  },
  {
    id: "rb-005",
    category: CATEGORIES.RATE_BELIEVE,
    text: "Rate how much you believe: luck plays a bigger role than hard work in most people's success. (1–10)",
  },

  // ── Rate How Much You Like ─────────────────────────────────────────────────
  {
    id: "rl-001",
    category: CATEGORIES.RATE_LIKE,
    text: "Rate how much you like being the center of attention at a party. (1 = hate it, 10 = love it)",
  },
  {
    id: "rl-002",
    category: CATEGORIES.RATE_LIKE,
    text: "Rate how much you like making big spontaneous decisions. (1–10)",
  },
  {
    id: "rl-003",
    category: CATEGORIES.RATE_LIKE,
    text: "Rate how much you like confrontation when you disagree with someone. (1–10)",
  },
  {
    id: "rl-004",
    category: CATEGORIES.RATE_LIKE,
    text: "Rate how much you like your current daily routine. (1–10)",
  },
  {
    id: "rl-005",
    category: CATEGORIES.RATE_LIKE,
    text: "Rate how much you like surprises. (1–10)",
  },

  // ── Have You Ever ──────────────────────────────────────────────────────────
  {
    id: "hye-001",
    category: CATEGORIES.HAVE_YOU_EVER,
    text: "Have you ever completely changed your opinion about someone after a single conversation?",
  },
  {
    id: "hye-002",
    category: CATEGORIES.HAVE_YOU_EVER,
    text: "Have you ever pretended not to see a notification so you wouldn't have to respond right away?",
  },
  {
    id: "hye-003",
    category: CATEGORIES.HAVE_YOU_EVER,
    text: "Have you ever made a big life decision based on a gut feeling alone?",
  },
  {
    id: "hye-004",
    category: CATEGORIES.HAVE_YOU_EVER,
    text: "Have you ever stayed in a friendship or relationship way longer than you should have?",
  },
  {
    id: "hye-005",
    category: CATEGORIES.HAVE_YOU_EVER,
    text: "Have you ever taken credit for something you didn't fully deserve?",
  },
  {
    id: "hye-006",
    category: CATEGORIES.HAVE_YOU_EVER,
    text: "Have you ever laughed at something you absolutely should not have?",
  },

  // ── Tell About a Time ──────────────────────────────────────────────────────
  {
    id: "tat-001",
    category: CATEGORIES.TELL_A_TIME,
    text: "Tell about a time when you had to make a really tough choice between two people.",
  },
  {
    id: "tat-002",
    category: CATEGORIES.TELL_A_TIME,
    text: "Tell about a time when something that seemed terrible at the time turned out to be a blessing.",
  },
  {
    id: "tat-003",
    category: CATEGORIES.TELL_A_TIME,
    text: "Tell about a time when you felt completely out of your depth but pushed through anyway.",
  },
  {
    id: "tat-004",
    category: CATEGORIES.TELL_A_TIME,
    text: "Tell about a time when a stranger unexpectedly made your day significantly better.",
  },
  {
    id: "tat-005",
    category: CATEGORIES.TELL_A_TIME,
    text: "Tell about a time when you surprised even yourself.",
  },
];

/**
 * Get a shuffled copy of questions, optionally filtered by category.
 * @param {string|null} category
 * @returns {Question[]}
 */
export function getQuestions(category = null) {
  const pool = category
    ? QUESTIONS.filter((q) => q.category === category)
    : [...QUESTIONS];

  // Fisher-Yates shuffle
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool;
}

/**
 * Get a single question by ID.
 * @param {string} id
 * @returns {Question|undefined}
 */
export function getQuestionById(id) {
  return QUESTIONS.find((q) => q.id === id);
}
