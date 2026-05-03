import React from "react";
import { useApp } from "../context/AppContext";
import styles from "./Header.module.css";

export default function Header({ onFavoritesOpen }) {
  const { favoriteQuestions } = useApp();

  return (
    <header className={styles.header}>
      <div className={styles.logo}>
        <span className={styles.logoQ}>Q</span>
        <span className={styles.logoGame}>Game</span>
      </div>

      <div className={styles.actions}>
        <button
          className={styles.iconBtn}
          onClick={onFavoritesOpen}
          aria-label="View favorites"
          title="Favorites"
        >
          <svg width="20" height="20" fill="none" viewBox="0 0 24 24">
            <path
              d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
              stroke="currentColor"
              strokeWidth="1.8"
              fill={favoriteQuestions.length > 0 ? "var(--accent)" : "none"}
              strokeLinejoin="round"
            />
          </svg>
          {favoriteQuestions.length > 0 && (
            <span className={styles.badge}>{favoriteQuestions.length}</span>
          )}
        </button>
      </div>
    </header>
  );
}
