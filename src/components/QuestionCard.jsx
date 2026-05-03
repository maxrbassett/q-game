import React, { useState, useEffect, useRef } from "react";
import { useApp } from "../context/AppContext";
import { useSwipe, useKeyPress } from "../hooks/index";
import AnswerPanel from "./AnswerPanel";
import styles from "./QuestionCard.module.css";

const CATEGORY_COLORS = {
  "Would You Rather":       "#e8c547",
  "Which Is Worse":         "#e85d47",
  "How Much Would It Take": "#47c5e8",
  "Rate How Much You Believe": "#9b47e8",
  "Rate How Much You Like": "#e847c5",
  "Have You Ever":          "#47e87a",
  "Tell About a Time":      "#e88547",
};

export default function QuestionCard() {
  const {
    currentQuestion,
    currentIndex,
    deck,
    nextQuestion,
    prevQuestion,
    toggleFavorite,
    isFavorite,
    getAnswer,
  } = useApp();

  const [showAnswer, setShowAnswer] = useState(false);
  const [animKey, setAnimKey] = useState(0);
  const [direction, setDirection] = useState(null); // 'left' | 'right'

  // Re-animate on question change
  useEffect(() => {
    setShowAnswer(false);
    setAnimKey((k) => k + 1);
    setDirection(null);
  }, [currentQuestion?.id]);

  const go = (dir) => {
    setDirection(dir);
    setTimeout(() => {
      if (dir === "left") nextQuestion();
      else prevQuestion();
    }, 120);
  };

  const swipeHandlers = useSwipe({
    onSwipeLeft: () => go("left"),
    onSwipeRight: () => go("right"),
  });

  useKeyPress("ArrowRight", () => go("left"));
  useKeyPress("ArrowLeft",  () => go("right"));

  if (!currentQuestion) return null;

  const accentColor = CATEGORY_COLORS[currentQuestion.category] ?? "var(--accent)";
  const hasAnswer = !!getAnswer(currentQuestion.id);
  const fav = isFavorite(currentQuestion.id);

  const exitClass =
    direction === "left"  ? styles.exitLeft  :
    direction === "right" ? styles.exitRight  : "";

  return (
    <div className={styles.wrapper}>
      {/* Progress bar */}
      <div className={styles.progress}>
        <div
          className={styles.progressBar}
          style={{
            width: `${((currentIndex + 1) / deck.length) * 100}%`,
            background: accentColor,
          }}
        />
      </div>

      <div className={styles.counter}>
        {currentIndex + 1} / {deck.length}
      </div>

      {/* Card */}
      <div
        key={animKey}
        className={`${styles.card} ${exitClass}`}
        style={{ "--card-accent": accentColor }}
        {...swipeHandlers}
      >
        {/* Category label */}
        <div className={styles.category} style={{ color: accentColor }}>
          {currentQuestion.category}
        </div>

        {/* Question text */}
        <p className={styles.question}>{currentQuestion.text}</p>

        {/* Card footer */}
        <div className={styles.cardFooter}>
          {hasAnswer && (
            <span className={styles.answeredBadge}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Answered
            </span>
          )}

          <button
            className={`${styles.favBtn} ${fav ? styles.favActive : ""}`}
            onClick={() => toggleFavorite(currentQuestion.id)}
            aria-label={fav ? "Remove from favorites" : "Add to favorites"}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path
                d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
                stroke={fav ? "none" : "currentColor"}
                fill={fav ? "var(--accent)" : "none"}
                strokeWidth="1.8"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* My Answer toggle */}
      <button
        className={styles.answerToggle}
        onClick={() => setShowAnswer((v) => !v)}
        style={{ "--btn-color": accentColor }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
          <path d="M12 20h9M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z"
            stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        {hasAnswer ? "Edit my answer" : "Write my answer"}
      </button>

      {showAnswer && (
        <AnswerPanel
          question={currentQuestion}
          onClose={() => setShowAnswer(false)}
        />
      )}

      {/* Nav buttons */}
      <div className={styles.nav}>
        <button
          className={styles.navBtn}
          onClick={() => go("right")}
          disabled={currentIndex === 0}
          aria-label="Previous question"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Prev
        </button>

        <button
          className={styles.navBtn}
          onClick={() => go("left")}
          aria-label="Next question"
        >
          Next
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>

      <p className={styles.swipeHint}>← swipe or use arrow keys →</p>
    </div>
  );
}
