/**
 * Q Game - App Context
 *
 * Provides global state (favorites, answers, active category)
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
} from "../services/storageService";
import { QUESTIONS, getQuestions } from "../data/questions";

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [activeCategory, setActiveCategory] = useState(null);
  const [favorites, setFavorites] = useState(() => getFavorites());
  const [answers, setAnswers] = useState(() => getAnswers());
  const [deck, setDeck] = useState(() => getQuestions(null));
  const [currentIndex, setCurrentIndex] = useState(0);

  // ── Category ────────────────────────────────────────────────────────────────

  const selectCategory = useCallback((category) => {
    setActiveCategory(category);
    setDeck(getQuestions(category));
    setCurrentIndex(0);
  }, []);

  // ── Deck navigation ─────────────────────────────────────────────────────────

  const nextQuestion = useCallback(() => {
    setCurrentIndex((i) => {
      if (i < deck.length - 1) return i + 1;
      // Reshuffle when deck is exhausted
      setDeck(getQuestions(activeCategory));
      return 0;
    });
  }, [deck.length, activeCategory]);

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

  const saveAnswer = useCallback((questionId, text) => {
    persistAnswer(questionId, text);
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
    // Category
    activeCategory,
    selectCategory,
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
