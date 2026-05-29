/**
 * Q Game - App Context
 *
 * Single source of global state. Owns auth, the question pool, the deck, and
 * per-user state (favorites, answers, custom tags, per-question overrides).
 *
 * Storage routing happens in storageService.js — every call takes a userId
 * (or null for guest mode), so this file doesn't care whether persistence is
 * local or cloud-backed.
 *
 * When `user` flips from null → signed-in, we auto-migrate guest data into
 * the cloud, then re-read all per-user state from cloud. The reverse (sign
 * out) drops back to the device's localStorage data.
 */

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  useEffect,
  useRef,
} from "react";
import {
  getFavorites,
  toggleFavorite as toggleFav,
  getAnswers,
  saveAnswer as persistAnswer,
  deleteAnswer as removeAnswer,
  getCustomTags,
  saveCustomTag,
  deleteCustomTag as removeCustomTag,
  getQuestionTagOverrides,
  setQuestionTags as persistQuestionTags,
  migrateGuestDataToCloud,
  deriveStats,
} from "../services/storageService";
import { supabase } from "../services/supabase";
import { QUESTIONS, getQuestions, loadQuestions } from "../data/questions";
import {
  slugify,
  effectiveTagsFor,
  tagLabel,
  getBuiltInTagSlugs,
  BUILT_IN_TAG_LABELS,
} from "../data/tags";

const AppContext = createContext(null);

export function AppProvider({ children }) {
  // ── Auth ────────────────────────────────────────────────────────────────────
  const [user, setUser] = useState(null);
  const [authReady, setAuthReady] = useState(!supabase); // ready immediately if cloud disabled
  const prevUserIdRef = useRef(null);

  // ── Question pool (DB-backed when cloud is enabled, else static seed) ───────
  const [allQuestions, setAllQuestions] = useState(QUESTIONS);

  // ── Per-user state (starts from local; refreshed when user changes) ─────────
  const [favorites, setFavorites] = useState(new Set());
  const [answers, setAnswers] = useState({});
  const [customTags, setCustomTags] = useState({});
  const [tagOverrides, setTagOverrides] = useState({});

  // ── Deck / filter / view ────────────────────────────────────────────────────
  const [activeCategory, setActiveCategory] = useState(null);
  const [activeTag, setActiveTag] = useState(null);
  const [view, setView] = useState("cards"); // "cards" | "categories" | "tags"
  const [deck, setDeck] = useState(() => getQuestions({ questions: QUESTIONS }));
  const [currentIndex, setCurrentIndex] = useState(0);

  const userId = user?.id ?? null;

  // ── Bootstrap: subscribe to auth + load questions ──────────────────────────
  useEffect(() => {
    let cancelled = false;
    if (!supabase) return;
    supabase.auth.getSession().then(({ data }) => {
      if (!cancelled) {
        setUser(data?.session?.user ?? null);
        setAuthReady(true);
      }
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => {
      cancelled = true;
      sub?.subscription?.unsubscribe?.();
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    loadQuestions().then((qs) => {
      if (!cancelled && qs && qs.length) setAllQuestions(qs);
    });
    return () => { cancelled = true; };
  }, []);

  // ── Refresh per-user state whenever the active user changes ────────────────
  useEffect(() => {
    let cancelled = false;
    async function refresh() {
      // On guest → signed-in transition, push local data up first.
      const prev = prevUserIdRef.current;
      if (!prev && userId) {
        try { await migrateGuestDataToCloud(userId); } catch (e) {
          console.warn("[auth] migration failed:", e?.message);
        }
      }
      prevUserIdRef.current = userId;

      const [favs, ans, ct, overrides] = await Promise.all([
        getFavorites(userId),
        getAnswers(userId),
        getCustomTags(userId),
        getQuestionTagOverrides(userId),
      ]);
      if (cancelled) return;
      setFavorites(favs);
      setAnswers(ans);
      setCustomTags(ct);
      setTagOverrides(overrides);
    }
    refresh();
    return () => { cancelled = true; };
  }, [userId]);

  // ── Rebuild deck whenever the pool, filter, or overrides change ────────────
  useEffect(() => {
    setDeck(getQuestions({
      questions: allQuestions,
      category: activeCategory,
      tag: activeTag,
      tagOverrides,
    }));
    setCurrentIndex(0);
  }, [allQuestions, activeCategory, activeTag, tagOverrides]);

  // ── Filter ──────────────────────────────────────────────────────────────────
  const selectCategory = useCallback((category) => {
    setActiveCategory(category);
    setActiveTag(null);
    setView("cards");
  }, []);

  const selectTag = useCallback((tag) => {
    setActiveTag(tag);
    setActiveCategory(null);
    setView("cards");
  }, []);

  const clearFilter = useCallback(() => {
    setActiveCategory(null);
    setActiveTag(null);
    setView("cards");
  }, []);

  // ── View ────────────────────────────────────────────────────────────────────
  const openView = useCallback((v) => setView(v), []);
  const closeView = useCallback(() => setView("cards"), []);

  // ── Deck navigation ─────────────────────────────────────────────────────────
  const nextQuestion = useCallback(() => {
    setCurrentIndex((i) => {
      if (i < deck.length - 1) return i + 1;
      // Reshuffle when deck is exhausted
      setDeck(getQuestions({
        questions: allQuestions,
        category: activeCategory,
        tag: activeTag,
        tagOverrides,
      }));
      return 0;
    });
  }, [deck.length, allQuestions, activeCategory, activeTag, tagOverrides]);

  const prevQuestion = useCallback(() => {
    setCurrentIndex((i) => Math.max(0, i - 1));
  }, []);

  const currentQuestion = deck[currentIndex] ?? null;

  // ── Favorites ──────────────────────────────────────────────────────────────
  const toggleFavorite = useCallback(async (questionId) => {
    await toggleFav(userId, questionId);
    setFavorites(await getFavorites(userId));
  }, [userId]);

  const isFavorite = useCallback(
    (questionId) => favorites.has(questionId),
    [favorites],
  );

  const favoriteQuestions = useMemo(
    () => allQuestions.filter((q) => favorites.has(q.id)),
    [favorites, allQuestions],
  );

  // ── Answers ────────────────────────────────────────────────────────────────
  const saveAnswer = useCallback(async (questionId, payload) => {
    await persistAnswer(userId, questionId, payload);
    setAnswers(await getAnswers(userId));
  }, [userId]);

  const deleteAnswer = useCallback(async (questionId) => {
    await removeAnswer(userId, questionId);
    setAnswers(await getAnswers(userId));
  }, [userId]);

  const getAnswer = useCallback(
    (questionId) => answers[questionId] || null,
    [answers],
  );

  // ── Tags ───────────────────────────────────────────────────────────────────
  const allTags = useMemo(() => {
    const builtInSlugs = getBuiltInTagSlugs(allQuestions);
    const customSlugs = Object.keys(customTags);
    const seen = new Set([
      ...builtInSlugs,
      ...customSlugs,
      ...Object.keys(BUILT_IN_TAG_LABELS),
    ]);

    const counts = {};
    for (const q of allQuestions) {
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
  }, [customTags, tagOverrides, allQuestions]);

  const getTagsForQuestion = useCallback(
    (question) => effectiveTagsFor(question, tagOverrides),
    [tagOverrides],
  );

  const setTagsForQuestion = useCallback(async (questionId, tagSlugs) => {
    await persistQuestionTags(userId, questionId, tagSlugs);
    setTagOverrides(await getQuestionTagOverrides(userId));
  }, [userId]);

  const createTag = useCallback(async (label) => {
    const trimmed = String(label).trim();
    if (!trimmed) return null;
    const slug = slugify(trimmed);
    if (!slug) return null;
    const builtIn = getBuiltInTagSlugs(allQuestions);
    if (!BUILT_IN_TAG_LABELS[slug] && !builtIn.has(slug)) {
      await saveCustomTag(userId, slug, trimmed);
      setCustomTags(await getCustomTags(userId));
    }
    return slug;
  }, [userId, allQuestions]);

  const deleteCustomTag = useCallback(async (slug) => {
    await removeCustomTag(userId, slug);
    setCustomTags(await getCustomTags(userId));
    // Cascade: strip tag from any per-question overrides
    const overrides = await getQuestionTagOverrides(userId);
    for (const qid of Object.keys(overrides)) {
      if (overrides[qid].includes(slug)) {
        await persistQuestionTags(userId, qid, overrides[qid].filter((t) => t !== slug));
      }
    }
    setTagOverrides(await getQuestionTagOverrides(userId));
    if (activeTag === slug) clearFilter();
  }, [userId, activeTag, clearFilter]);

  // ── Auth actions ───────────────────────────────────────────────────────────
  const signInWithGoogle = useCallback(async () => {
    if (!supabase) throw new Error("Sign-in is unavailable: Supabase not configured");
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin },
    });
    if (error) throw error;
  }, []);

  const signOut = useCallback(async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
  }, []);

  // ── Stats ──────────────────────────────────────────────────────────────────
  const stats = useMemo(
    () => deriveStats(allQuestions, answers, favorites),
    [allQuestions, answers, favorites],
  );

  // ── Context value ──────────────────────────────────────────────────────────
  const value = {
    // Auth
    user,
    authReady,
    isCloudEnabled: !!supabase,
    signInWithGoogle,
    signOut,
    // Questions
    allQuestions,
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
