import React, { useEffect } from "react";
import { CATEGORIES } from "../data/questions";
import { useApp } from "../context/AppContext";
import { useKeyPress } from "../hooks";
import styles from "./ListView.module.css";

const CATEGORY_ICONS = {
  [CATEGORIES.WOULD_YOU_RATHER]: "⚖️",
  [CATEGORIES.WHICH_IS_WORSE]:   "😬",
  [CATEGORIES.HOW_MUCH]:         "💸",
  [CATEGORIES.RATE_BELIEVE]:     "🤔",
  [CATEGORIES.RATE_LIKE]:        "❤️",
  [CATEGORIES.HAVE_YOU_EVER]:    "✋",
  [CATEGORIES.TELL_A_TIME]:      "💬",
  [CATEGORIES.OPINION]:          "💭",
};

const CATEGORY_COLORS = {
  [CATEGORIES.WOULD_YOU_RATHER]: "#e8c547",
  [CATEGORIES.WHICH_IS_WORSE]:   "#e85d47",
  [CATEGORIES.HOW_MUCH]:         "#47c5e8",
  [CATEGORIES.RATE_BELIEVE]:     "#9b47e8",
  [CATEGORIES.RATE_LIKE]:        "#e847c5",
  [CATEGORIES.HAVE_YOU_EVER]:    "#47e87a",
  [CATEGORIES.TELL_A_TIME]:      "#e88547",
  [CATEGORIES.OPINION]:          "#47e8c5",
};

export default function ListView({ mode, onClose }) {
  const { selectCategory, selectTag, allTags, allQuestions } = useApp();

  useKeyPress("Escape", onClose);

  // Lock body scroll while the overlay is open
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, []);

  const isCategories = mode === "categories";
  const title = isCategories ? "Categories" : "Tags";

  // Pre-compute per-category counts
  const categoryCounts = isCategories
    ? Object.values(CATEGORIES).reduce((acc, cat) => {
        acc[cat] = allQuestions.filter((q) => q.category === cat).length;
        return acc;
      }, {})
    : null;

  const tagsToShow = !isCategories
    ? allTags.filter((t) => t.count > 0 || t.isCustom)
    : [];

  return (
    <div className={styles.overlay} role="dialog" aria-label={title}>
      <header className={styles.header}>
        <button className={styles.backBtn} onClick={onClose} aria-label="Back">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <h1 className={styles.title}>{title}</h1>
        <div className={styles.spacer} />
      </header>

      <div className={styles.scroll}>
        {isCategories ? (
          <ul className={styles.grid}>
            {Object.values(CATEGORIES).map((cat) => (
              <li key={cat}>
                <button
                  className={styles.tile}
                  style={{ "--tile-accent": CATEGORY_COLORS[cat] }}
                  onClick={() => selectCategory(cat)}
                >
                  <span className={styles.tileIcon} aria-hidden="true">
                    {CATEGORY_ICONS[cat]}
                  </span>
                  <span className={styles.tileText}>
                    <span className={styles.tileTitle}>{cat}</span>
                    <span className={styles.tileMeta}>{categoryCounts[cat]} questions</span>
                  </span>
                  <svg className={styles.tileChevron} width="18" height="18" viewBox="0 0 24 24" fill="none">
                    <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
              </li>
            ))}
          </ul>
        ) : tagsToShow.length === 0 ? (
          <div className={styles.empty}>
            <span className={styles.emptyIcon}>#</span>
            <p>No tags yet.</p>
            <p className={styles.emptyHint}>
              Tap "+ tag" on any question to create your own tag.
            </p>
          </div>
        ) : (
          <ul className={styles.grid}>
            {tagsToShow.map((t) => (
              <li key={t.slug}>
                <button
                  className={`${styles.tile} ${styles.tileTag}`}
                  onClick={() => selectTag(t.slug)}
                >
                  <span className={styles.tileIcon} aria-hidden="true">#</span>
                  <span className={styles.tileText}>
                    <span className={styles.tileTitle}>{t.label}</span>
                    <span className={styles.tileMeta}>
                      {t.count} question{t.count === 1 ? "" : "s"}
                      {t.isCustom && <span className={styles.customBadge}> · custom</span>}
                    </span>
                  </span>
                  <svg className={styles.tileChevron} width="18" height="18" viewBox="0 0 24 24" fill="none">
                    <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
