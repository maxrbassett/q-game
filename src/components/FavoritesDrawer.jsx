import React, { useState } from "react";
import { useApp } from "../context/AppContext";
import { getQuestionById } from "../data/questions";
import styles from "./FavoritesDrawer.module.css";

export default function FavoritesDrawer({ onClose }) {
  const { favoriteQuestions, toggleFavorite, getAnswer, currentQuestion, nextQuestion } = useApp();
  const [expandedId, setExpandedId] = useState(null);

  return (
    <div className={styles.overlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className={styles.drawer}>
        <div className={styles.handle} />

        <div className={styles.header}>
          <h2 className={styles.title}>
            Saved Questions
            <span className={styles.count}>{favoriteQuestions.length}</span>
          </h2>
          <button className={styles.closeBtn} onClick={onClose}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        {favoriteQuestions.length === 0 ? (
          <div className={styles.empty}>
            <span className={styles.emptyIcon}>♡</span>
            <p>No favorites yet.</p>
            <p className={styles.emptyHint}>Tap the heart on any question to save it here.</p>
          </div>
        ) : (
          <ul className={styles.list}>
            {favoriteQuestions.map((q) => {
              const answer = getAnswer(q.id);
              const isExpanded = expandedId === q.id;

              return (
                <li key={q.id} className={styles.item}>
                  <div className={styles.itemTop}>
                    <span className={styles.itemCategory}>{q.category}</span>
                    <button
                      className={styles.unfavBtn}
                      onClick={() => toggleFavorite(q.id)}
                      aria-label="Remove from favorites"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                        <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                      </svg>
                    </button>
                  </div>

                  <p
                    className={styles.itemText}
                    onClick={() => setExpandedId(isExpanded ? null : q.id)}
                  >
                    {q.text}
                  </p>

                  {answer && (answer.choice || answer.text) && (
                    <div className={styles.answerPreview}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                        <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      <span>
                        {answer.choice && (
                          <strong className={styles.answerChoice}>{answer.choice}</strong>
                        )}
                        {answer.text && (
                          <span className={answer.choice ? styles.answerNotes : ""}>
                            {isExpanded
                              ? answer.text
                              : `${answer.text.slice(0, 80)}${answer.text.length > 80 ? "…" : ""}`}
                          </span>
                        )}
                      </span>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
