import React, { useState, useEffect, useRef } from "react";
import { useApp } from "../context/AppContext";
import { useSwipe, useKeyPress } from "../hooks/index";
import { getChoices } from "../data/choices";
import { tagLabel } from "../data/tags";
import TagPicker from "./TagPicker";
import styles from "./QuestionCard.module.css";

const CATEGORY_COLORS = {
  "Would You Rather":          "#e8c547",
  "Which Is Worse":            "#e85d47",
  "How Much Would It Take":    "#47c5e8",
  "Rate How Much You Believe": "#9b47e8",
  "Rate How Much You Like":    "#e847c5",
  "Have You Ever":             "#47e87a",
  "Tell About a Time":         "#e88547",
  "Your Opinion":              "#47e8c5",
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
    saveAnswer,
    deleteAnswer,
    getTagsForQuestion,
    setTagsForQuestion,
    customTags,
    selectTag,
  } = useApp();

  const [answerOpen, setAnswerOpen] = useState(true);
  const [answerText, setAnswerText] = useState("");
  const [selectedChoice, setSelectedChoice] = useState(null);
  const [animKey, setAnimKey] = useState(0);
  const [direction, setDirection] = useState(null);
  const [tagPickerOpen, setTagPickerOpen] = useState(false);
  const textareaRef = useRef(null);

  const questionTags = currentQuestion ? getTagsForQuestion(currentQuestion) : [];

  const handleRemoveTag = (slug) => {
    if (!currentQuestion) return;
    setTagsForQuestion(
      currentQuestion.id,
      questionTags.filter((t) => t !== slug)
    );
  };

  const choices = currentQuestion ? getChoices(currentQuestion) : null;
  const hasChoices = !!choices;

  // Reset answer state when question changes
  useEffect(() => {
    if (!currentQuestion) return;
    const existing = getAnswer(currentQuestion.id);
    setAnswerText(existing?.text ?? "");
    setSelectedChoice(existing?.choice ?? null);
    setAnswerOpen(true);
    setAnimKey((k) => k + 1);
    setDirection(null);
  }, [currentQuestion?.id]);

  // Auto-focus textarea when answer section opens (only for free-response questions)
  useEffect(() => {
    if (answerOpen && !hasChoices) {
      setTimeout(() => textareaRef.current?.focus(), 50);
    }
  }, [answerOpen, currentQuestion?.id, hasChoices]);

  const persist = (nextChoice, nextText) => {
    const text = (nextText ?? "").trim();
    if (!text && !nextChoice) {
      deleteAnswer(currentQuestion.id);
    } else {
      saveAnswer(currentQuestion.id, { text, choice: nextChoice ?? null });
    }
  };

  const handleSave = () => {
    persist(selectedChoice, answerText);
  };

  const handleSelectChoice = (option) => {
    const next = selectedChoice === option ? null : option;
    setSelectedChoice(next);
    persist(next, answerText);
  };

  const handleDelete = () => {
    deleteAnswer(currentQuestion.id);
    setAnswerText("");
    setSelectedChoice(null);
  };

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
  const existing = getAnswer(currentQuestion.id);
  const hasAnswer = !!existing;
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
        <p className={styles.question}>
          {choices?.displayText ?? currentQuestion.text}
        </p>

        {/* Choice buttons */}
        {hasChoices && (
          <div
            className={`${styles.choices} ${
              choices.type === "scale" ? styles.choicesScale :
              choices.type === "binary" ? styles.choicesBinary :
              styles.choicesMulti
            }`}
            role="radiogroup"
            aria-label="Select your answer"
          >
            {choices.options.map((opt) => {
              const active = selectedChoice === opt;
              return (
                <button
                  key={opt}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  className={`${styles.choiceBtn} ${active ? styles.choiceBtnActive : ""}`}
                  style={active ? { "--choice-accent": accentColor } : undefined}
                  onClick={() => handleSelectChoice(opt)}
                >
                  {opt}
                </button>
              );
            })}
          </div>
        )}

        {/* Tag chips */}
        <div className={styles.tagRow}>
          {questionTags.map((slug) => (
            <span key={slug} className={styles.tagChip}>
              <button
                type="button"
                className={styles.tagChipLabel}
                onClick={() => selectTag(slug)}
                title={`Filter by ${tagLabel(slug, customTags)}`}
              >
                {tagLabel(slug, customTags)}
              </button>
              <button
                type="button"
                className={styles.tagChipRemove}
                onClick={() => handleRemoveTag(slug)}
                aria-label={`Remove tag ${tagLabel(slug, customTags)}`}
              >
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none">
                  <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"/>
                </svg>
              </button>
            </span>
          ))}
          <button
            type="button"
            className={styles.tagAddBtn}
            onClick={() => setTagPickerOpen(true)}
          >
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none">
              <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            tag
          </button>
        </div>

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
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
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

      {tagPickerOpen && (
        <TagPicker
          question={currentQuestion}
          onClose={() => setTagPickerOpen(false)}
        />
      )}

      {/* Inline answer section */}
      <div className={styles.answerSection}>
        <button
          className={styles.answerToggle}
          onClick={() => setAnswerOpen((v) => !v)}
          style={{ "--btn-color": accentColor }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M12 20h9M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z"
              stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          {hasChoices
            ? (answerText ? "Edit additional thoughts" : "Add additional thoughts")
            : (hasAnswer ? "Edit my answer" : "Write my answer")}
          <svg
            className={`${styles.chevron} ${answerOpen ? styles.chevronOpen : ""}`}
            width="14" height="14" viewBox="0 0 24 24" fill="none"
          >
            <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>

        {answerOpen && (
          <div className={styles.answerBody}>
            <textarea
              ref={textareaRef}
              className={styles.textarea}
              placeholder={hasChoices
                ? "Additional thoughts (optional)..."
                : "Type your answer here..."}
              value={answerText}
              onChange={(e) => setAnswerText(e.target.value)}
              rows={3}
            />
            <div className={styles.answerActions}>
              {hasAnswer && (
                <button className={styles.deleteBtn} onClick={handleDelete}>
                  Delete
                </button>
              )}
              <button
                className={styles.saveBtn}
                onClick={handleSave}
                disabled={!answerText.trim() && !hasAnswer}
                style={{ "--btn-color": accentColor }}
              >
                {hasAnswer ? "Update" : "Save"} {hasChoices ? "Notes" : "Answer"}
              </button>
            </div>
          </div>
        )}
      </div>

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
