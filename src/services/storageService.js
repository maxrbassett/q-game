/**
 * Q Game - Storage Service (routing seam)
 *
 * Every storage function takes `userId` (or null) as its first argument and
 * routes to either:
 *   • cloudStorage (Supabase)   when userId is a signed-in user
 *   • localStorage              when userId is null (guest mode)
 *
 * All functions return Promises so callers can `await` regardless of path —
 * this lets AppContext use a single code path.
 *
 * Device-only state (Seen, Settings) stays in localStorage unconditionally —
 * those are per-device, not per-user.
 */

import * as cloud from "./cloudStorage";

const KEYS = {
  FAVORITES: "qgame_favorites",
  ANSWERS: "qgame_answers",
  SEEN: "qgame_seen",
  SETTINGS: "qgame_settings",
  CUSTOM_TAGS: "qgame_custom_tags",
  QUESTION_TAGS: "qgame_question_tags",
};

// ── localStorage helpers ─────────────────────────────────────────────────────

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

// ── Favorites ────────────────────────────────────────────────────────────────

export async function getFavorites(userId) {
  if (userId) return cloud.getFavorites(userId);
  return new Set(read(KEYS.FAVORITES, []));
}

export async function toggleFavorite(userId, questionId) {
  if (userId) return cloud.toggleFavorite(userId, questionId);
  const favs = new Set(read(KEYS.FAVORITES, []));
  const next = favs.has(questionId) ? (favs.delete(questionId), false) : (favs.add(questionId), true);
  write(KEYS.FAVORITES, Array.from(favs));
  return next;
}

// ── Answers ──────────────────────────────────────────────────────────────────

export async function getAnswers(userId) {
  if (userId) return cloud.getAnswers(userId);
  return read(KEYS.ANSWERS, {});
}

export async function saveAnswer(userId, questionId, payload) {
  if (userId) return cloud.saveAnswer(userId, questionId, payload);
  const answers = read(KEYS.ANSWERS, {});
  const text = (payload?.text ?? "").trim();
  const choice = payload?.choice ?? null;
  answers[questionId] = { text, choice, timestamp: Date.now() };
  write(KEYS.ANSWERS, answers);
}

export async function deleteAnswer(userId, questionId) {
  if (userId) return cloud.deleteAnswer(userId, questionId);
  const answers = read(KEYS.ANSWERS, {});
  delete answers[questionId];
  write(KEYS.ANSWERS, answers);
}

// ── Custom Tags ──────────────────────────────────────────────────────────────

export async function getCustomTags(userId) {
  if (userId) return cloud.getCustomTags(userId);
  return read(KEYS.CUSTOM_TAGS, {});
}

export async function saveCustomTag(userId, slug, label) {
  if (userId) return cloud.saveCustomTag(userId, slug, label);
  const tags = read(KEYS.CUSTOM_TAGS, {});
  tags[slug] = { label, createdAt: tags[slug]?.createdAt ?? Date.now() };
  write(KEYS.CUSTOM_TAGS, tags);
}

export async function deleteCustomTag(userId, slug) {
  if (userId) return cloud.deleteCustomTag(userId, slug);
  const tags = read(KEYS.CUSTOM_TAGS, {});
  delete tags[slug];
  write(KEYS.CUSTOM_TAGS, tags);
}

// ── Per-question tag overrides ───────────────────────────────────────────────

export async function getQuestionTagOverrides(userId) {
  if (userId) return cloud.getQuestionTagOverrides(userId);
  return read(KEYS.QUESTION_TAGS, {});
}

export async function setQuestionTags(userId, questionId, tagSlugs) {
  if (userId) return cloud.setQuestionTags(userId, questionId, tagSlugs);
  const overrides = read(KEYS.QUESTION_TAGS, {});
  overrides[questionId] = Array.from(new Set(tagSlugs));
  write(KEYS.QUESTION_TAGS, overrides);
}

// ── Guest → cloud migration (auto on first sign-in) ──────────────────────────

/**
 * Reads all local guest data and copies it to the user's cloud rows. Idempotent.
 * Returns true if anything was migrated.
 */
export async function migrateGuestDataToCloud(userId) {
  const local = {
    favorites: read(KEYS.FAVORITES, []),
    answers: read(KEYS.ANSWERS, {}),
    customTags: read(KEYS.CUSTOM_TAGS, {}),
    questionTagOverrides: read(KEYS.QUESTION_TAGS, {}),
  };
  const hasAny =
    local.favorites.length > 0 ||
    Object.keys(local.answers).length > 0 ||
    Object.keys(local.customTags).length > 0 ||
    Object.keys(local.questionTagOverrides).length > 0;
  if (!hasAny) return false;
  await cloud.migrateGuestData(userId, local);
  return true;
}

// ── Seen Questions (device-only) ─────────────────────────────────────────────

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

// ── Settings (device-only) ───────────────────────────────────────────────────

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

// ── Stats (derived, no extra storage needed) ─────────────────────────────────

export function deriveStats(allQuestions, answers, favorites) {
  return {
    totalQuestions: allQuestions.length,
    answered: Object.keys(answers).length,
    favorites: favorites.size,
    percentComplete: allQuestions.length
      ? Math.round((Object.keys(answers).length / allQuestions.length) * 100)
      : 0,
  };
}
