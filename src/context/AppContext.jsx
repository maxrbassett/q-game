/**
 * Q Game - App Context
 *
 * Provides global state (favorites, answers, active filter, custom tags, view)
 * to the whole component tree without prop drilling.
 *
 * Firebase migration: swap storageService calls for async Firestore
 * calls and add a `user` value from Firebase Auth.
 */

import React, { createContext, useContext, useState, useCallback, useMemo } from "react";
import {
  getFavorites,
  toggleFavorite as toggleFav,
  getAnswers,
  saveAnswer as persistAnswer,
  deleteAnswer as removeAnswer,
  getStats,
  getCustomTags,
  saveCustomTag,
  deleteCustomTag as removeCustomTag,
  getQuestionTagOverrides,
  setQuestionTags as persistQuestionTags,
} from "../services/storageService";
import { QUESTIONS, getQuestions } from "../data/questions";
import {
  slugify,
  effectiveTagsFor,
  tagLabel,
  getBuiltInTagSlugs,
  BUILT_IN_TAG_LABELS,
} from "../data/tags";

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [activeCategory, setActiveCategory] = useState(null);
  const [activeTag, setActiveTag] = useState(null);
  const [view, setView] = useState("cards"); // "cards" | "categories" | "tags"
  const [favorites, setFavorites] = useState(() => getFavorites());
  const [answers, setAnswers] = useState(() => getAnswers());
  const [customTags, setCustomTags] = useState(() => getCustomTags());
  const [tagOverrides, setTagOverrides] = useState(() => getQuestionTagOverrides());
  const [deck, setDeck] = useState(() => getQuestions({ tagOverrides: getQuestionTagOverrides() }));
  const [currentIndex, setCurrentIndex] = useState(0);

  // ── Filter ──────────────────────────────────────────────────────────────────

  const rebuildDeck = useCallback((filter) => {
    setDeck(getQuestions({ ...filter, tagOverrides }));
    setCurrentIndex(0);
  }, [tagOverrides]);

  const selectCategory = useCallback((category) => {
    setActiveCategory(category);
    setActiveTag(null);
    setView("cards");
    rebuildDeck({ category });
  }, [rebuildDeck]);

  const selectTag = useCallback((tag) => {
    setActiveTag(tag);
    setActiveCategory(null);
    setView("cards");
    rebuildDeck({ tag });
  }, [rebuildDeck]);

  const clearFilter = useCallback(() => {
    setActiveCategory(null);
    setActiveTag(null);
    setView("cards");
    rebuildDeck({});
  }, [rebuildDeck]);

  // ── View ────────────────────────────────────────────────────────────────────

  const openView = useCallback((v) => setView(v), []);
  const closeView = useCallback(() => setView("cards"), []);

  // ── Deck navigation ─────────────────────────────────────────────────────────

  const nextQuestion = useCallback(() => {
    setCurrentIndex((i) => {
      if (i < deck.length - 1) return i + 1;
      // Reshuffle when deck is exhausted
      setDeck(getQuestions({ category: activeCategory, tag: activeTag, tagOverrides }));
      return 0;
    });
  }, [deck.length, activeCategory, activeTag, tagOverrides]);

  const prevQuestion = useCallback(() => {
    setCurrentIndex((i) => Math.max(0, i - 1));
  }, []);

  const currentQuestion = deck[currentIndex] ?? null;

  // ── Favorites ────────────────────────────────────────────────────────────────

  const toggleFavorite = useCallback((questionId) => {
    toggleFav(questionId);
    setFavorites(getFavorites());
  }, []);

  const isFavorite = useCallback(
    (questionId) => favorites.has(questionId),
    [favorites]
  );

  const favoriteQuestions = useMemo(
    () => QUESTIONS.filter((q) => favorites.has(q.id)),
    [favorites]
  );

  // ── Answers ──────────────────────────────────────────────────────────────────

  const saveAnswer = useCallback((questionId, payload) => {
    persistAnswer(questionId, payload);
    setAnswers(getAnswers());
  }, []);

  const deleteAnswer = useCallback((questionId) => {
    removeAnswer(questionId);
    setAnswers(getAnswers());
  }, []);

  const getAnswer = useCallback(
    (questionId) => answers[questionId] || null,
    [answers]
  );

  // ── Tags ────────────────────────────────────────────────────────────────────

  /**
   * Tags actually present in the live data + any user-created tags. Used to
   * populate the filter strip and the tag picker.
   * Each entry: { slug, label, count, isCustom }
   */
  const allTags = useMemo(() => {
    const builtInSlugs = getBuiltInTagSlugs();
    const customSlugs = Object.keys(customTags);
    // Include any slug we have a label for — keeps friendly built-ins available
    // in the picker even if a user has removed them from every question.
    const seen = new Set([
      ...builtInSlugs,
      ...customSlugs,
      ...Object.keys(BUILT_IN_TAG_LABELS),
    ]);

    // Count usage across the live (override-aware) data
    const counts = {};
    for (const q of QUESTIONS) {
      const tags = effectiveTagsFor(q, tagOverrides);
      for (const t of tags) {
        counts[t] = (counts[t] || 0) + 1;
        seen.add(t);
      }
    }

    return Array.from(seen).map((slug) => ({
      slug,
      label: tagLabel(slug, customTags),
      count: counts[slug] || 0,
      isCustom: !BUILT_IN_TAG_LABELS[slug] && !builtInSlugs.has(slug),
    })).sort((a, b) => a.label.localeCompare(b.label));
  }, [customTags, tagOverrides]);

  const getTagsForQuestion = useCallback(
    (question) => effectiveTagsFor(question, tagOverrides),
    [tagOverrides]
  );

  const setTagsForQuestion = useCallback((questionId, tagSlugs) => {
    persistQuestionTags(questionId, tagSlugs);
    setTagOverrides(getQuestionTagOverrides());
  }, []);

  /**
   * Creates a custom tag from a free-text label and returns its slug.
   * If the slug already exists (built-in or custom), it's returned as-is.
   */
  const createTag = useCallback((label) => {
    const trimmed = String(label).trim();
    if (!trimmed) return null;
    const slug = slugify(trimmed);
    if (!slug) return null;
    // Only register as custom if it's not already a built-in
    if (!BUILT_IN_TAG_LABELS[slug] && !getBuiltInTagSlugs().has(slug)) {
      saveCustomTag(slug, trimmed);
      setCustomTags(getCustomTags());
    }
    return slug;
  }, []);

  const deleteCustomTag = useCallback((slug) => {
    removeCustomTag(slug);
    setCustomTags(getCustomTags());
    // Also remove this tag from any per-question overrides
    const overrides = getQuestionTagOverrides();
    let changed = false;
    for (const qid of Object.keys(overrides)) {
      if (overrides[qid].includes(slug)) {
        overrides[qid] = overrides[qid].filter((t) => t !== slug);
        persistQuestionTags(qid, overrides[qid]);
        changed = true;
      }
    }
    if (changed) setTagOverrides(getQuestionTagOverrides());
    if (activeTag === slug) clearFilter();
  }, [activeTag, clearFilter]);

  // ── Stats ─────────────────────────────────────────────────────────────────────

  const stats = useMemo(() => getStats(QUESTIONS), [answers, favorites]);

  // ── Context value ─────────────────────────────────────────────────────────────

  const value = {
    // Deck
    deck,
    currentIndex,
    currentQuestion,
    nextQuestion,
    prevQuestion,
    // Filter
    activeCategory,
    activeTag,
    selectCategory,
    selectTag,
    clearFilter,
    // View
    view,
    openView,
    closeView,
    // Favorites
    favorites,
    favoriteQuestions,
    toggleFavorite,
    isFavorite,
    // Answers
    answers,
    saveAnswer,
    deleteAnswer,
    getAnswer,
    // Tags
    allTags,
    customTags,
    getTagsForQuestion,
    setTagsForQuestion,
    createTag,
    deleteCustomTag,
    // Stats
    stats,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
