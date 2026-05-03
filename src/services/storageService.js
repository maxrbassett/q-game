/**
 * Q Game - Storage Service
 *
 * This is the ONLY file that touches localStorage.
 * When you're ready to add Firebase, replace the implementations
 * here and the rest of the app needs zero changes.
 *
 * Firebase migration path:
 *   1. npm install firebase
 *   2. Create src/services/firebase.js with your config
 *   3. Replace localStorage calls below with Firestore calls
 *   4. Add auth.currentUser.uid to scope data per-user
 */

const KEYS = {
  FAVORITES: "qgame_favorites",
  ANSWERS: "qgame_answers",
  SEEN: "qgame_seen",
  SETTINGS: "qgame_settings",
};

// ── Helpers ──────────────────────────────────────────────────────────────────

function read(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function write(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

// ── Favorites ─────────────────────────────────────────────────────────────────

/**
 * Returns Set of favorited question IDs.
 * Firebase equivalent: getDocs(query(collection(db, "favorites"), where("userId", "==", uid)))
 */
export function getFavorites() {
  return new Set(read(KEYS.FAVORITES, []));
}

/**
 * Toggles a question's favorite status.
 * @param {string} questionId
 * @returns {boolean} new favorite state
 */
export function toggleFavorite(questionId) {
  const favs = getFavorites();
  if (favs.has(questionId)) {
    favs.delete(questionId);
  } else {
    favs.add(questionId);
  }
  write(KEYS.FAVORITES, Array.from(favs));
  return favs.has(questionId);
}

export function isFavorite(questionId) {
  return getFavorites().has(questionId);
}

// ── Answers ───────────────────────────────────────────────────────────────────

/**
 * Returns map of { questionId: { text, timestamp } }
 * Firebase equivalent: getDocs(query(collection(db, "answers"), where("userId", "==", uid)))
 */
export function getAnswers() {
  return read(KEYS.ANSWERS, {});
}

/**
 * Saves a user's answer to a question.
 * @param {string} questionId
 * @param {string} answerText
 */
export function saveAnswer(questionId, answerText) {
  const answers = getAnswers();
  answers[questionId] = {
    text: answerText,
    timestamp: Date.now(),
  };
  write(KEYS.ANSWERS, answers);
}

export function deleteAnswer(questionId) {
  const answers = getAnswers();
  delete answers[questionId];
  write(KEYS.ANSWERS, answers);
}

export function getAnswer(questionId) {
  return getAnswers()[questionId] || null;
}

// ── Seen Questions ────────────────────────────────────────────────────────────

/**
 * Tracks which questions the user has already seen in the current "deck".
 * Reset when they've gone through all questions in a category.
 */
export function getSeenIds() {
  return new Set(read(KEYS.SEEN, []));
}

export function markAsSeen(questionId) {
  const seen = getSeenIds();
  seen.add(questionId);
  write(KEYS.SEEN, Array.from(seen));
}

export function resetSeen() {
  write(KEYS.SEEN, []);
}

// ── Settings ──────────────────────────────────────────────────────────────────

const DEFAULT_SETTINGS = {
  showAnsweredBadge: true,
  haptics: true,
};

export function getSettings() {
  return { ...DEFAULT_SETTINGS, ...read(KEYS.SETTINGS, {}) };
}

export function saveSetting(key, value) {
  const settings = getSettings();
  settings[key] = value;
  write(KEYS.SETTINGS, settings);
}

// ── Stats (derived, no extra storage needed) ──────────────────────────────────

export function getStats(allQuestions) {
  const answers = getAnswers();
  const favorites = getFavorites();

  return {
    totalQuestions: allQuestions.length,
    answered: Object.keys(answers).length,
    favorites: favorites.size,
    percentComplete: Math.round(
      (Object.keys(answers).length / allQuestions.length) * 100
    ),
  };
}
