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
  CUSTOM_TAGS: "qgame_custom_tags",
  QUESTION_TAGS: "qgame_question_tags",
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
 * @param {{ text?: string, choice?: string | null }} payload
 */
export function saveAnswer(questionId, payload) {
  const answers = getAnswers();
  const text = (payload?.text ?? "").trim();
  const choice = payload?.choice ?? null;
  answers[questionId] = {
    text,
    choice,
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

// ── Custom Tags ───────────────────────────────────────────────────────────────

/**
 * Returns a map of user-created tags: { [slug]: { label, createdAt } }.
 * Firebase equivalent: getDocs(collection(db, "userTags"))
 */
export function getCustomTags() {
  return read(KEYS.CUSTOM_TAGS, {});
}

/**
 * Persists a custom tag. Overwrites existing entry with same slug.
 * @param {string} slug
 * @param {string} label
 */
export function saveCustomTag(slug, label) {
  const tags = getCustomTags();
  tags[slug] = {
    label,
    createdAt: tags[slug]?.createdAt ?? Date.now(),
  };
  write(KEYS.CUSTOM_TAGS, tags);
}

export function deleteCustomTag(slug) {
  const tags = getCustomTags();
  delete tags[slug];
  write(KEYS.CUSTOM_TAGS, tags);
}

// ── Per-question Tag Overrides ────────────────────────────────────────────────

/**
 * Returns a map of { [questionId]: string[] } — when present, the user's tag
 * list fully replaces the data's tag list for that question.
 */
export function getQuestionTagOverrides() {
  return read(KEYS.QUESTION_TAGS, {});
}

/**
 * Saves the effective tag list for a question. Pass [] to record an empty
 * override (signals "user removed all tags").
 * @param {string} questionId
 * @param {string[]} tagSlugs
 */
export function setQuestionTags(questionId, tagSlugs) {
  const overrides = getQuestionTagOverrides();
  overrides[questionId] = Array.from(new Set(tagSlugs));
  write(KEYS.QUESTION_TAGS, overrides);
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
