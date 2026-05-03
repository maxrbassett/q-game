import React from "react";
import { CATEGORIES } from "../data/questions";
import { useApp } from "../context/AppContext";
import styles from "./CategoryFilter.module.css";

const CATEGORY_ICONS = {
  [CATEGORIES.WOULD_YOU_RATHER]: "⚖️",
  [CATEGORIES.WHICH_IS_WORSE]:   "😬",
  [CATEGORIES.HOW_MUCH]:         "💸",
  [CATEGORIES.RATE_BELIEVE]:     "🤔",
  [CATEGORIES.RATE_LIKE]:        "❤️",
  [CATEGORIES.HAVE_YOU_EVER]:    "✋",
  [CATEGORIES.TELL_A_TIME]:      "💬",
};

export default function CategoryFilter() {
  const { activeCategory, selectCategory } = useApp();

  return (
    <nav className={styles.nav} aria-label="Question categories">
      <div className={styles.scroll}>
        {/* "All" pill */}
        <button
          className={`${styles.pill} ${activeCategory === null ? styles.active : ""}`}
          onClick={() => selectCategory(null)}
        >
          All
        </button>

        {Object.values(CATEGORIES).map((cat) => (
          <button
            key={cat}
            className={`${styles.pill} ${activeCategory === cat ? styles.active : ""}`}
            onClick={() => selectCategory(cat)}
          >
            <span className={styles.icon} aria-hidden="true">
              {CATEGORY_ICONS[cat]}
            </span>
            {cat}
          </button>
        ))}
      </div>
    </nav>
  );
}
