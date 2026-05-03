import React from "react";
import { useApp } from "../context/AppContext";
import { CATEGORIES } from "../data/questions";
import styles from "./StatsPanel.module.css";

export default function StatsPanel({ onClose }) {
  const { stats, answers, favorites } = useApp();

  // Count answers per category
  const { QUESTIONS } = require("../data/questions");
  const byCat = Object.values(CATEGORIES).map((cat) => {
    const total = QUESTIONS.filter((q) => q.category === cat).length;
    const answered = QUESTIONS.filter(
      (q) => q.category === cat && answers[q.id]
    ).length;
    return { cat, total, answered };
  });

  return (
    <div className={styles.overlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className={styles.panel}>
        <div className={styles.handle} />

        <div className={styles.header}>
          <h2 className={styles.title}>Your Stats</h2>
          <button className={styles.closeBtn} onClick={onClose}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        {/* Big numbers */}
        <div className={styles.bigStats}>
          <div className={styles.stat}>
            <span className={styles.statNum}>{stats.answered}</span>
            <span className={styles.statLabel}>Answered</span>
          </div>
          <div className={styles.divider} />
          <div className={styles.stat}>
            <span className={styles.statNum}>{stats.favorites}</span>
            <span className={styles.statLabel}>Favorites</span>
          </div>
          <div className={styles.divider} />
          <div className={styles.stat}>
            <span className={styles.statNum}>{stats.percentComplete}%</span>
            <span className={styles.statLabel}>Complete</span>
          </div>
        </div>

        {/* Overall progress bar */}
        <div className={styles.progressWrap}>
          <div className={styles.progressTrack}>
            <div
              className={styles.progressFill}
              style={{ width: `${stats.percentComplete}%` }}
            />
          </div>
          <span className={styles.progressLabel}>
            {stats.answered} of {stats.totalQuestions} questions answered
          </span>
        </div>

        {/* Per-category breakdown */}
        <h3 className={styles.breakdownTitle}>By Category</h3>
        <ul className={styles.breakdown}>
          {byCat.map(({ cat, total, answered }) => (
            <li key={cat} className={styles.breakdownItem}>
              <div className={styles.breakdownTop}>
                <span className={styles.breakdownCat}>{cat}</span>
                <span className={styles.breakdownCount}>{answered}/{total}</span>
              </div>
              <div className={styles.miniTrack}>
                <div
                  className={styles.miniFill}
                  style={{ width: `${(answered / total) * 100}%` }}
                />
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
